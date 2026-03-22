"use client";

import Link from "next/link";
import { useProjectContext } from "@/src/context/ProjectContext";
import { getProject, incrementProjectViews, getProjects } from "@/src/app/modules/projects.service";
import { getAttachmentsByTarget } from "@/src/app/modules/attachments.service";
import { useState, useEffect } from "react";
import MapPicker from "@/src/components/feature/MapPicker";
import { MapPin } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useParams } from "next/navigation";

interface Project {
  id: string;
  name: string;
  slug: string;
  province?: string;
  ward?: string;
  developer?: string;
  property_type_id?: string;
  property_types?: {
    id: string;
    name: string;
  };
  status?: string;
  area?: number;
  price?: number;
  content?: string;
  project_code?: string;
  thumbnail_url?: string;
  latitude?: number;
  longitude?: number;
  project_tags?: Array<{
    tags: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
}

interface Attachment {
  id: string;
  url: string;
  secure_url: string;
  original_name?: string;
  size_bytes?: string;
  public_id?: string;
  target_id: string;
  target_type: string;
  created_at: string;
}

export default function ProjectDetail() {
  const params = useParams();
  const slug = params?.slug as string;
  const { projectSlug, setProjectSlug, activeProjectId, setActiveProjectId } = useProjectContext();
  const [project, setProject] = useState<Project | null>(null);
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [startIndex, setStartIndex] = useState(0);

  const scrollImages = (direction: 'left' | 'right') => {
    if (direction === 'left' && startIndex > 0) {
      setStartIndex(startIndex - 1);
    } else if (direction === 'right' && startIndex + 4 < attachments.length) {
      setStartIndex(startIndex + 1);
    }
  };

  const formatPrice = (price?: number | string | null) => {
    if (!price) return "Liên hệ";
    const numPrice = Number(price);
    if (isNaN(numPrice)) return "Liên hệ";

    if (numPrice >= 1000000000) {
      const billions = numPrice / 1000000000;
      return `${billions.toFixed(1)} Tỷ`;
    } else if (numPrice >= 1000000) {
      const millions = numPrice / 1000000;
      return `${millions.toFixed(0)} Triệu`;
    } else if (numPrice >= 1000) {
      const thousands = numPrice / 1000;
      return `${thousands.toFixed(0)} Nghìn`;
    }
    return `${numPrice.toLocaleString('vi-VN')} đồng`;
  };

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const slugToUse = slug || projectSlug;

        if (!slugToUse) {
          setError('Không tìm thấy thông tin dự án');
          return;
        }

        // Update context with current slug
        if (slug && slug !== projectSlug) {
          setProjectSlug(slug);
        }

        const result = await getProject(slugToUse);

        if (result.success) {
          const currentProject = result.data;
          setProject(currentProject);
          setActiveProjectId(currentProject.id);

          // Lấy 3 dự án lân cận
          try {
            let related: Project[] = [];

            // 1. Ưu tiên cùng phường/xã
            if (currentProject.province && currentProject.ward) {
              const wardRes = await getProjects({
                province: currentProject.province,
                ward: currentProject.ward,
                limit: 10
              });
              if (wardRes.success) related = [...related, ...wardRes.data];
            }

            // Lọc bớt kết quả trùng và trừ dự án hiện tại
            related = related.filter((p, index, self) =>
              p.id !== currentProject.id && index === self.findIndex((t) => t.id === p.id)
            );

            // 2. Nếu thiếu, bổ sung thêm dự án cùng Tỉnh/Thành phố
            if (related.length < 3 && currentProject.province) {
              const provRes = await getProjects({
                province: currentProject.province,
                limit: 10
              });
              if (provRes.success) related = [...related, ...provRes.data];
            }

            related = related.filter((p, index, self) =>
              p.id !== currentProject.id && index === self.findIndex((t) => t.id === p.id)
            );

            // 3. Nếu vẫn không đủ lấy random (không có filter loc)
            if (related.length < 3) {
              const anyRes = await getProjects({ limit: 10 });
              if (anyRes.success) related = [...related, ...anyRes.data];
            }

            related = related.filter((p, index, self) =>
              p.id !== currentProject.id && index === self.findIndex((t) => t.id === p.id)
            ).slice(0, 3);

            setRelatedProjects(related);
          } catch (err) {
            console.warn("Failed to fetch related projects", err);
          }

          // Increment view count
          if (result.data.id) {
            incrementProjectViews(result.data.id).catch(err => {
              console.error('Failed to increment views:', err);
            });
          }

          // Fetch project attachments
          setLoadingAttachments(true);
          try {
            const attachmentsResult = await getAttachmentsByTarget(result.data.id, 'project');
            if (attachmentsResult.success) {
              setAttachments(attachmentsResult.data || []);
            }
          } catch (attachError) {
            console.error('Error fetching attachments:', attachError);
          } finally {
            setLoadingAttachments(false);
          }
        } else {
          setError(result.error || 'Không thể tải thông tin dự án');
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Lỗi khi tải thông tin dự án');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [slug, projectSlug, setProjectSlug, setActiveProjectId]);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'đang mở bán':
        return (
          <div className="absolute top-4 left-4 bg-emerald-600 text-white text-sm font-bold px-3 py-1.5 uppercase shadow-sm">
            Đang mở bán
          </div>
        );
      case 'sắp mở bán':
        return (
          <div className="absolute top-4 left-4 bg-blue-600 text-white text-sm font-bold px-3 py-1.5 uppercase shadow-sm">
            Sắp mở bán
          </div>
        );
      case 'đã bàn giao':
        return (
          <div className="absolute top-4 left-4 bg-gray-600 text-white text-sm font-bold px-3 py-1.5 uppercase shadow-sm">
            Đã bàn giao
          </div>
        );
      default:
        return null;
    }
  };

  const formatArea = (areaMin?: number, areaMax?: number) => {
    if (areaMin && areaMax) {
      return `${areaMin} m² - ${areaMax} m²`;
    } else if (areaMin) {
      return `${areaMin} m²`;
    } else if (areaMax) {
      return `${areaMax} m²`;
    }
    return 'Liên hệ';
  };

  const formatLocation = (province?: string, ward?: string) => {
    if (ward && province) {
      return `${ward}, ${province}`;
    } else if (province) {
      return province;
    }
    return 'Cả nước';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
            Đang tải thông tin dự án...
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-12">
          <div className="text-red-600 dark:text-red-400 mb-4">
            {error || 'Không tìm thấy dự án'}
          </div>
          <Link
            href="/du-an"
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
          >
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <nav aria-label="Breadcrumb" className="flex mb-4">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link className="text-sm text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white transition-colors" href="/">Trang chủ</Link>
          </li>
          <li>
            <div className="flex items-center">
              <span className="material-symbols-outlined text-gray-400 text-sm mx-1">chevron_right</span>
              <Link className="text-sm text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white transition-colors" href="/du-an">Danh sách dự án</Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <span className="material-symbols-outlined text-gray-400 text-sm mx-1">chevron_right</span>
              <span className="text-sm text-gray-900 dark:text-gray-200 font-medium">{project.name}</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-[70%] space-y-8">
          <div className="space-y-2">
            <div className="w-full h-[400px] relative">
              <img
                alt={project.name}
                className="w-full h-full object-cover border border-gray-200 dark:border-slate-700 cursor-pointer"
                src={attachments.length > 0 ? attachments[selectedImageIndex]?.secure_url : (project.thumbnail_url || 'https://via.placeholder.com/800x400?text=No+Image')}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('placeholder.com')) {
                    target.src = 'https://via.placeholder.com/800x400?text=No+Image';
                  }
                }}
              />
              {getStatusBadge(project.status)}
            </div>
            {attachments.length > 0 ? (
              <div className="relative">
                {/* Scroll Left Button */}
                {startIndex > 0 && (
                  <button
                    onClick={() => scrollImages('left')}
                    className="absolute left-[-50px] top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 p-2 shadow-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors rounded-full"
                  >
                    <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-xl">chevron_left</span>
                  </button>
                )}

                {/* Scroll Right Button */}
                {startIndex + 4 < attachments.length && (
                  <button
                    onClick={() => scrollImages('right')}
                    className="absolute right-[-50px] top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 p-2 shadow-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors rounded-full"
                  >
                    <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-xl">chevron_right</span>
                  </button>
                )}

                <div className="grid grid-cols-4 gap-2">
                  {attachments.slice(startIndex, startIndex + 4).map((attachment, index) => {
                    const actualIndex = startIndex + index;
                    const isLast = index === 3 && startIndex + 4 < attachments.length;

                    return (
                      <div
                        key={attachment.id}
                        className={`h-24 ${isLast ? 'relative cursor-pointer group' : ''}`}
                        onClick={() => setSelectedImageIndex(actualIndex)}
                      >
                        <img
                          alt={attachment.original_name || `Hình ảnh ${actualIndex + 1}`}
                          className={`w-full h-full object-cover border border-gray-200 dark:border-slate-700 hover:opacity-80 cursor-pointer transition-opacity ${selectedImageIndex === actualIndex ? 'ring-2 ring-emerald-500' : ''
                            }`}
                          src={attachment.secure_url}
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.src.includes('placeholder.com')) {
                              target.src = 'https://via.placeholder.com/200x200?text=Error';
                            }
                          }}
                        />
                        {isLast && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                            <span className="text-white font-medium">+{attachments.length - (startIndex + 4)} ảnh</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="h-24 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">Không có ảnh</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{project.name}</h1>
            <div className="flex items-center text-slate-500 dark:text-slate-400 mb-6">
              <span className="material-symbols-outlined text-[18px] mr-1.5">location_on</span>
              <span>{formatLocation(project.province, project.ward)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-gray-100 dark:border-slate-700">
              <div>
                <span className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Diện tích</span>
                <span className="text-xl font-semibold text-slate-900 dark:text-white">{project.area ? `${project.area.toLocaleString('vi-VN')} m²` : '---'}</span>
              </div>
              <div className="w-px h-10 bg-gray-200 dark:bg-slate-700 hidden sm:block"></div>
              <div>
                <span className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Giá</span>
                <span className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">{formatPrice(project.price)}</span>
              </div>
              {project.property_types && (
                <>
                  <div className="w-px h-10 bg-gray-200 dark:bg-slate-700 hidden sm:block"></div>
                  <div>
                    <span className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Loại hình</span>
                    <span className="text-lg font-medium text-slate-900 dark:text-white">{project.property_types.name}</span>
                  </div>
                </>
              )}
              {project.developer && (
                <>
                  <div className="w-px h-10 bg-gray-200 dark:bg-slate-700 hidden sm:block"></div>
                  <div>
                    <span className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Chủ đầu tư</span>
                    <span className="text-lg font-medium text-slate-900 dark:text-white">{project.developer}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wide border-b border-gray-100 dark:border-slate-700 pb-3">Mô tả chi tiết</h2>
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 space-y-4 text-justify leading-relaxed">
              {project.content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    img: (props: any) => {
                      const { node, ...rest } = props;
                      if (!rest.src) return null;
                      return <img {...rest} alt={rest.alt || 'Hình ảnh dự án'} />;
                    }
                  }}
                >
                  {project.content}
                </ReactMarkdown>
              ) : (
                <p>Chưa có thông tin mô tả chi tiết cho dự án này.</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white border-l-4 border-emerald-600 pl-3">Vị trí trên bản đồ</h3>
            <div className="w-full">
              {(project?.latitude !== undefined && project?.latitude !== null) &&
                (project?.longitude !== undefined && project?.longitude !== null) ? (
                <MapPicker
                  initialLat={parseFloat(project.latitude.toString())}
                  initialLng={parseFloat(project.longitude.toString())}
                  readOnly={true}
                />
              ) : (
                <div className="w-full h-[300px] rounded-xl border border-slate-200 dark:border-slate-800 relative bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                  <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-6 py-3 border border-gray-200 dark:border-slate-700 shadow-md">
                    <div className="flex items-center space-x-2">
                      <span className="material-symbols-outlined text-amber-600 animate-pulse">explore</span>
                      <span className="font-medium text-slate-900 dark:text-white uppercase text-xs tracking-wider">Đang cập nhật dữ liệu bản đồ...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[30%] space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wide border-b border-gray-100 dark:border-slate-700 pb-2">Dự án lân cận</h3>
            <div className="space-y-4">
              {relatedProjects.length > 0 ? relatedProjects.map((p) => (
                <Link key={p.id} href={`/du-an/${p.slug}`} className="group flex items-start space-x-3 pb-4 border-b border-gray-100 dark:border-slate-700 last:border-0 last:pb-0">
                  <div className="w-20 h-20 shrink-0">
                    <img
                      alt={p.name}
                      className="w-full h-full object-cover border border-gray-200 dark:border-slate-700 group-hover:opacity-80 transition-opacity"
                      src={p.thumbnail_url || 'https://via.placeholder.com/200x200?text=No+Image'}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes('placeholder.com')) {
                          target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                        }
                      }}
                    />
                  </div>
                  <div className="flex-grow">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors line-clamp-2 mb-1">
                      {p.name}
                    </h4>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center">
                      <span className="material-symbols-outlined text-[14px] mr-1">location_on</span> {formatLocation(p.province, p.ward)}
                    </div>
                  </div>
                </Link>
              )) : (
                <div className="text-sm text-slate-500 dark:text-slate-400 italic">Đang tải dự án lân cận...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
