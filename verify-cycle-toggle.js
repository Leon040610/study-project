// 验证修复后的混合行为
// - Plans 视图: per-cycle 切换（一次勾选整个周期）
// - Calendar 视图右侧: per-day 切换（只影响当前选中日）
// 关键: 单日操作不能影响整个周期, 反之亦然
console.log('========== 单日独立性测试 ==========\n')

function isTaskCompletedOnDate(task, dateStr) {
  if (task.completedDates) return task.completedDates[dateStr] === true
  return false
}

function isTaskFullyCompleted(task) {
  if (!task.startDate || !task.endDate) {
    return task.completedDates?.[task.date] === true
  }
  const start = new Date(`${task.startDate}T00:00:00`)
  const end = new Date(`${task.endDate}T00:00:00`)
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return task.completedDates?.[task.date] === true
  }
  const cursor = new Date(start)
  while (cursor <= end) {
    const y = cursor.getFullYear()
    const m = String(cursor.getMonth() + 1).padStart(2, '0')
    const d = String(cursor.getDate()).padStart(2, '0')
    const ds = `${y}-${m}-${d}`
    if (!task.completedDates || task.completedDates[ds] !== true) return false
    cursor.setDate(cursor.getDate() + 1)
  }
  return true
}

function toggleTaskOnDate(tasks, taskId, dateStr, completed) {
  const index = tasks.findIndex(t => t.id === taskId)
  if (index === -1) return
  const oldTask = tasks[index]
  const newCompletedDates = {
    ...(oldTask.completedDates || {}),
    [dateStr]: completed
  }
  // 关键: 对象替换
  tasks[index] = { ...oldTask, completedDates: newCompletedDates }
}

function toggleTaskCycle(tasks, taskId, completed) {
  const index = tasks.findIndex(t => t.id === taskId)
  if (index === -1) return
  const oldTask = tasks[index]
  const dateStrs = []
  if (!oldTask.startDate || !oldTask.endDate) {
    if (oldTask.date) dateStrs.push(oldTask.date)
  } else {
    const start = new Date(`${oldTask.startDate}T00:00:00`)
    const end = new Date(`${oldTask.endDate}T00:00:00`)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      if (oldTask.date) dateStrs.push(oldTask.date)
    } else {
      const cursor = new Date(start)
      while (cursor <= end) {
        const y = cursor.getFullYear()
        const m = String(cursor.getMonth() + 1).padStart(2, '0')
        const d = String(cursor.getDate()).padStart(2, '0')
        dateStrs.push(`${y}-${m}-${d}`)
        cursor.setDate(cursor.getDate() + 1)
      }
    }
  }
  const newCompletedDates = { ...(oldTask.completedDates || {}) }
  for (const ds of dateStrs) newCompletedDates[ds] = completed
  tasks[index] = { ...oldTask, completedDates: newCompletedDates }
}

let pass = 0, fail = 0
function assert(name, cond) {
  if (cond) { console.log(`  ✓ ${name}`); pass++ }
  else { console.log(`  ✗ ${name}`); fail++ }
}

// =========================================================
// 【场景 1】当前 bug 复现: Calendar 视图取消单日不能影响整个周期
// =========================================================
console.log('【场景 1】Calendar 视图 per-day 取消只影响当天 (修复后)')
let tasks = [
  { id: 't1', title: '复习', date: '2026-06-19', startDate: '2026-06-19', endDate: '2026-06-25', planTitle: 'P1', completed: false, completedDates: {} }
]
// 先整个周期标记 (模拟 Plans 视图)
toggleTaskCycle(tasks, 't1', true)
assert('全周期标记后 6/19 已完成', isTaskCompletedOnDate(tasks[0], '2026-06-19') === true)
assert('全周期标记后 6/22 已完成', isTaskCompletedOnDate(tasks[0], '2026-06-22') === true)
assert('全周期标记后 6/25 已完成', isTaskCompletedOnDate(tasks[0], '2026-06-25') === true)

// 用户在 Calendar 视图点击 6/22 取消勾选
toggleTaskOnDate(tasks, 't1', '2026-06-22', false)
assert('取消 6/22 后: 6/19 仍为已完成 (不被影响)', isTaskCompletedOnDate(tasks[0], '2026-06-19') === true)
assert('取消 6/22 后: 6/20 仍为已完成 (不被影响)', isTaskCompletedOnDate(tasks[0], '2026-06-20') === true)
assert('取消 6/22 后: 6/21 仍为已完成 (不被影响)', isTaskCompletedOnDate(tasks[0], '2026-06-21') === true)
assert('取消 6/22 后: 6/22 变为未完成 (仅当天变化)', isTaskCompletedOnDate(tasks[0], '2026-06-22') === false)
assert('取消 6/22 后: 6/25 仍为已完成 (不被影响)', isTaskCompletedOnDate(tasks[0], '2026-06-25') === true)
assert('取消 6/22 后: 任务不再"完全完成" (因 6/22 未勾)', isTaskFullyCompleted(tasks[0]) === false)
console.log()

// =========================================================
// 【场景 2】Calendar 视图: 单独勾选某一天不会影响其他天
// =========================================================
console.log('【场景 2】Calendar 视图 per-day 勾选只影响当天 (修复后)')
tasks = [
  { id: 't2', title: '任务', date: '2026-06-19', startDate: '2026-06-19', endDate: '2026-06-25', planTitle: 'P1', completed: false, completedDates: {} }
]
toggleTaskOnDate(tasks, 't2', '2026-06-20', true)
assert('勾选 6/20 后: 6/19 未完成', isTaskCompletedOnDate(tasks[0], '2026-06-19') === false)
assert('勾选 6/20 后: 6/20 已完成', isTaskCompletedOnDate(tasks[0], '2026-06-20') === true)
assert('勾选 6/20 后: 6/21 未完成 (不被影响)', isTaskCompletedOnDate(tasks[0], '2026-06-21') === false)
assert('勾选 6/20 后: 6/25 未完成', isTaskCompletedOnDate(tasks[0], '2026-06-25') === false)
console.log()

// =========================================================
// 【场景 3】Plans 视图: 全周期切换仍正确 (修复后保持)
// =========================================================
console.log('【场景 3】Plans 视图 per-cycle 切换 (保持)')
tasks = [
  { id: 't3', title: '周期任务', date: '2026-06-19', startDate: '2026-06-19', endDate: '2026-06-25', planTitle: 'P1', completed: false, completedDates: {} }
]
toggleTaskCycle(tasks, 't3', true)
assert('Plans 勾选后: 整个周期 6/19-6/25 全部完成', isTaskFullyCompleted(tasks[0]) === true)
toggleTaskCycle(tasks, 't3', false)
assert('Plans 取消后: 整个周期 6/19-6/25 全部未完成', isTaskFullyCompleted(tasks[0]) === false)
console.log()

// =========================================================
// 【场景 4】混合: Plans 标记全周期 → Calendar 取消单日 → Calendar 再次勾选单日
// =========================================================
console.log('【场景 4】Plans → Calendar 取消 → Calendar 再勾 的完整流程')
tasks = [
  { id: 't4', title: '混合流程', date: '2026-06-19', startDate: '2026-06-19', endDate: '2026-06-25', planTitle: 'P1', completed: false, completedDates: {} }
]
toggleTaskCycle(tasks, 't4', true)
assert('1. Plans 标记后整个周期完成', isTaskFullyCompleted(tasks[0]) === true)
toggleTaskOnDate(tasks, 't4', '2026-06-22', false)
assert('2. Calendar 取消 6/22 后其他天仍为完成', isTaskCompletedOnDate(tasks[0], '2026-06-19') === true && isTaskCompletedOnDate(tasks[0], '2026-06-25') === true)
assert('3. 6/22 单独变为未完成', isTaskCompletedOnDate(tasks[0], '2026-06-22') === false)
toggleTaskOnDate(tasks, 't4', '2026-06-22', true)
assert('4. Calendar 再次勾选 6/22 后整个周期恢复完成', isTaskFullyCompleted(tasks[0]) === true)
console.log()

// =========================================================
// 【场景 5】Calendar 视图 el-checkbox 响应式更新 (对象替换)
// =========================================================
console.log('【场景 5】el-checkbox 响应式 (对象替换触发)')
tasks = [
  { id: 't5', title: '响应式', date: '2026-06-19', startDate: '2026-06-19', endDate: '2026-06-25', planTitle: 'P1', completed: false, completedDates: {} }
]
const beforeRef = tasks[0]
toggleTaskOnDate(tasks, 't5', '2026-06-22', true)
const afterRef = tasks[0]
assert('task 对象被替换 (新引用)', beforeRef !== afterRef)
assert('新对象上 6/22 已完成', isTaskCompletedOnDate(afterRef, '2026-06-22') === true)
assert('新对象上 6/19 仍为未完成 (单日操作)', isTaskCompletedOnDate(afterRef, '2026-06-19') === false)
console.log()

// =========================================================
// 【场景 6】: 边界 - 7 天周期内逐日切换累积
// =========================================================
console.log('【场景 6】用户逐日勾选 7 天周期')
tasks = [
  { id: 't6', title: '逐日', date: '2026-06-19', startDate: '2026-06-19', endDate: '2026-06-25', planTitle: 'P1', completed: false, completedDates: {} }
]
for (let day = 19; day <= 25; day++) {
  const ds = `2026-06-${String(day).padStart(2, '0')}`
  toggleTaskOnDate(tasks, 't6', ds, true)
}
assert('6/19 标记', isTaskCompletedOnDate(tasks[0], '2026-06-19') === true)
assert('6/22 标记', isTaskCompletedOnDate(tasks[0], '2026-06-22') === true)
assert('6/25 标记', isTaskCompletedOnDate(tasks[0], '2026-06-25') === true)
assert('7 天全部完成后视为"完全完成"', isTaskFullyCompleted(tasks[0]) === true)

// 取消 6/22
toggleTaskOnDate(tasks, 't6', '2026-06-22', false)
assert('取消 6/22 后其他天仍为完成', isTaskCompletedOnDate(tasks[0], '2026-06-19') === true && isTaskCompletedOnDate(tasks[0], '2026-06-25') === true)
assert('取消 6/22 后任务不再"完全完成"', isTaskFullyCompleted(tasks[0]) === false)
console.log()

// =========================================================
console.log('========== 结果 ==========')
console.log(`通过: ${pass}    失败: ${fail}`)
console.log(fail === 0 ? '✅ 全部通过' : '❌ 有失败项')
