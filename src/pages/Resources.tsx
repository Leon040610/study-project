import { useState, useEffect } from 'react';
import { Search, Filter, Star, BookOpen, Video, FileText, GraduationCap, ExternalLink } from 'lucide-react';
import { resourceAPI } from '@/utils/api';
import type { Resource } from '@/types';

const categories = ['全部', 'programming', 'data science', 'database', 'computer science', 'cloud'];
const categoryLabels: Record<string, string> = {
  '全部': '全部',
  programming: '编程开发',
  'data science': '数据科学',
  database: '数据库',
  'computer science': '计算机科学',
  cloud: '云计算',
};

const typeIcons: Record<string, typeof BookOpen> = {
  book: BookOpen,
  video: Video,
  article: FileText,
  course: GraduationCap,
};

const typeLabels: Record<string, string> = {
  book: '书籍',
  video: '视频',
  article: '文章',
  course: '课程',
};

export const Resources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await resourceAPI.getAll();
        setResources(data);
        setFilteredResources(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  useEffect(() => {
    let result = resources;
    
    if (selectedCategory !== '全部') {
      result = result.filter(r => r.category === selectedCategory);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.title.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term) ||
        r.author?.toLowerCase().includes(term)
      );
    }
    
    setFilteredResources(result);
  }, [resources, selectedCategory, searchTerm]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">学习资源库</h1>
        <p className="text-gray-500 mt-1">发现优质学习资源，加速您的学习之旅</p>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索学习资源..."
              className="input-field pl-12"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {categoryLabels[category]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="card h-64 bg-gray-100 animate-pulse"></div>
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">暂无资源</h3>
          <p className="text-gray-500 mt-2">没有找到符合条件的学习资源</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map(resource => {
            const TypeIcon = typeIcons[resource.type] || BookOpen;
            return (
              <div 
                key={resource.id}
                className="card hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <TypeIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">{categoryLabels[resource.category]}</span>
                      <span className="text-xs text-gray-400 ml-2">{typeLabels[resource.type]}</span>
                    </div>
                  </div>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {resource.title}
                </h3>

                {resource.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {resource.description}
                  </p>
                )}

                {resource.author && (
                  <p className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">作者：</span>{resource.author}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={star}
                        className={`w-4 h-4 ${
                          star <= resource.rating 
                            ? 'text-accent fill-accent' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-500 ml-1">{resource.rating}</span>
                  </div>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary font-medium hover:underline"
                  >
                    访问资源
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
