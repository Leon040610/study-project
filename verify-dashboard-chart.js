// 验证"近 7 天任务完成趋势"图表的真实数据计算
console.log('========== 近 7 天任务完成趋势 测试 ==========\n')

// 模拟 dataStore 状态
const tasks = [
  // 任务 1: 周期任务，跨越 5 天
  { id: 't1', title: 'A', planTitle: 'P1', date: '2026-06-15', startDate: '2026-06-15', endDate: '2026-06-19', completed: false, completedDates: { '2026-06-15': true, '2026-06-16': true, '2026-06-17': true, '2026-06-19': true } },
  // 任务 2: 单日任务
  { id: 't2', title: 'B', planTitle: 'P1', date: '2026-06-18', completed: false, completedDates: { '2026-06-18': true } },
  // 任务 3: 周期任务，未完成
  { id: 't3', title: 'C', planTitle: 'P2', date: '2026-06-17', startDate: '2026-06-17', endDate: '2026-06-23', completed: false, completedDates: {} },
  // 任务 4: 周期任务，部分完成
  { id: 't4', title: 'D', planTitle: 'P2', date: '2026-06-16', startDate: '2026-06-16', endDate: '2026-06-22', completed: false, completedDates: { '2026-06-19': true, '2026-06-20': true } }
]

function isTaskCompletedOnDate(task, dateStr) {
  if (task.completedDates) return task.completedDates[dateStr] === true
  return false
}

function isTaskActiveOnDate(task, dateStr) {
  if (task.startDate && task.endDate) {
    return dateStr >= task.startDate && dateStr <= task.endDate
  }
  return task.date === dateStr
}

// 模拟图表的数据计算逻辑
function computeLast7DaysData(tasks, refDate) {
  const dayLabels = []
  const dayTotals = []
  const dayCompleted = []
  const cursor = new Date(refDate)
  for (let i = 6; i >= 0; i--) {
    const d = new Date(cursor)
    d.setDate(cursor.getDate() - i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const ds = `${y}-${m}-${dd}`
    dayLabels.push(`${m}/${dd}`)

    const total = tasks.filter(t => isTaskActiveOnDate(t, ds)).length
    dayTotals.push(total)

    const done = tasks.filter(t => isTaskCompletedOnDate(t, ds)).length
    dayCompleted.push(done)
  }
  return { dayLabels, dayTotals, dayCompleted }
}

let pass = 0, fail = 0
function assert(name, cond, got) {
  if (cond) { console.log(`  ✓ ${name}`); pass++ }
  else { console.log(`  ✗ ${name}  -> got: ${JSON.stringify(got)}`); fail++ }
}

// =========================================================
// 场景 1: 真实数据计算
// =========================================================
console.log('【场景 1】基于真实任务计算近 7 天数据')
// 假设今天是 2026-06-21
const result = computeLast7DaysData(tasks, '2026-06-21')
console.log('  日期标签:', result.dayLabels)
console.log('  计划任务:', result.dayTotals)
console.log('  已完成数:', result.dayCompleted)

// 6/15 (i=6 前 6 天): t1 周期 (6/15-6/19) 包含
// 6/15 总: t1 ✓ 完成
// 6/16 总: t1, t4 (6/16-6/22) ✓ 完成: t1
// 6/17 总: t1, t3 (6/17-6/23), t4 ✓ 完成: t1
// 6/18 总: t1, t2, t3, t4 ✓ 完成: t1, t2
// 6/19 总: t1, t3, t4 ✓ 完成: t1, t4
// 6/20 总: t3, t4 ✓ 完成: t4
// 6/21 总: t3, t4 ✓ 完成: 0

assert('6/15 总数 = 1', result.dayTotals[0] === 1, result.dayTotals[0])
assert('6/15 完成 = 1', result.dayCompleted[0] === 1, result.dayCompleted[0])
assert('6/18 总数 = 4', result.dayTotals[3] === 4, result.dayTotals[3])
assert('6/18 完成 = 1 (仅 t2 在 6/18 勾选)', result.dayCompleted[3] === 1, result.dayCompleted[3])
assert('6/20 总数 = 2', result.dayTotals[5] === 2, result.dayTotals[5])
assert('6/20 完成 = 1', result.dayCompleted[5] === 1, result.dayCompleted[5])
assert('6/21 总数 = 2', result.dayTotals[6] === 2, result.dayTotals[6])
assert('6/21 完成 = 0', result.dayCompleted[6] === 0, result.dayCompleted[6])
console.log()

// =========================================================
// 场景 2: 空数据
// =========================================================
console.log('【场景 2】空任务列表')
const empty = computeLast7DaysData([], '2026-06-21')
assert('空数据时所有天总数 = 0', empty.dayTotals.every(v => v === 0))
assert('空数据时所有天完成 = 0', empty.dayCompleted.every(v => v === 0))
console.log()

// =========================================================
// 场景 3: 单日任务 (旧数据格式)
// =========================================================
console.log('【场景 3】仅含旧数据 (无 startDate/endDate)')
const legacyTasks = [
  { id: 'l1', title: '旧', date: '2026-06-19', completed: true, completedDates: { '2026-06-19': true } }
]
const legacy = computeLast7DaysData(legacyTasks, '2026-06-21')
assert('旧数据 6/19 总数 = 1', legacy.dayTotals[4] === 1, legacy.dayTotals[4])
assert('旧数据 6/19 完成 = 1', legacy.dayCompleted[4] === 1, legacy.dayCompleted[4])
assert('旧数据 6/20 不包含', legacy.dayTotals[5] === 0, legacy.dayTotals[5])
console.log()

// =========================================================
// 场景 4: 完成数不应大于总数
// =========================================================
console.log('【场景 4】数据完整性检查')
for (let i = 0; i < 7; i++) {
  assert(`第 ${i+1} 天: 完成数 <= 总数 (${result.dayCompleted[i]} <= ${result.dayTotals[i]})`, result.dayCompleted[i] <= result.dayTotals[i])
}
console.log()

// =========================================================
console.log('========== 结果 ==========')
console.log(`通过: ${pass}    失败: ${fail}`)
console.log(fail === 0 ? '✅ 全部通过' : '❌ 有失败项')
