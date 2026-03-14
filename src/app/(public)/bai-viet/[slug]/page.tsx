"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Camera, Plus, X } from "lucide-react";
import RichTextEditor from "@/src/components/ui/RichTextEditor";
import LocationSelector from "@/src/components/feature/LocationSelector";
import { loadAllFormOptions, SelectOption } from "@/src/app/modules/form-options.service";
import { uploadListingAttachments, deleteAttachment } from "@/src/app/modules/upload.service";
import { getAllTagNamesAPI, processTagsForListingClient } from "@/src/app/modules/tags.service.client";
import { useAuthStore } from "@/src/store/authStore";

interface Attachment {
  id: string;
  url: string;
  secure_url: string;
  public_id: string | null;
  original_name: string | null;
  size_bytes: string | null;
  target_id: string;
  target_type: string;
  created_at: string;
}

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const { accessToken } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [listingId, setListingId] = useState("");

  const [transactionTypeId, setTransactionTypeId] = useState("");
  const [propertyTypeId, setPropertyTypeId] = useState("");
  const [selectedHashTags, setSelectedHashTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [description, setDescription] = useState("");

  // Options loaded from API
  const [propertyTypes, setPropertyTypes] = useState<SelectOption[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<SelectOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Form data states
  const [title, setTitle] = useState("");
  const [listingSlug, setListingSlug] = useState("");
  const [province, setProvince] = useState("");
  const [ward, setWard] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [price, setPrice] = useState("");
  const [width, setWidth] = useState("");
  const [length, setLength] = useState("");
  const [direction, setDirection] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [floorCount, setFloorCount] = useState("");
  const [bedroomCount, setBedroomCount] = useState("");

  // File states
  const [initialImages, setInitialImages] = useState<Attachment[]>([]);
  const [deletedApiImages, setDeletedApiImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive property type for conditional rendering
  const selectedPropertyType = propertyTypes.find(pt => pt.id === propertyTypeId);
  const selectedTransactionType = transactionTypes.find(tt => tt.id === transactionTypeId);

  const isApartment = selectedPropertyType?.hashtag === "chung-cu";
  const isHouse = ["nha-pho", "biet-thu", "shophouse", "nha-tro"].includes(selectedPropertyType?.hashtag || "");
  const isOffice = ["van-phong", "kho-xuong"].includes(selectedPropertyType?.hashtag || "");

  const showBedrooms = isHouse || isApartment;
  const showFloors = isHouse || isOffice;
  const showDimensions = !isApartment;

  // INITIAL LOAD
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [options, tags] = await Promise.all([
          loadAllFormOptions(),
          getAllTagNamesAPI()
        ]);
        setPropertyTypes(options.propertyTypes);
        setTransactionTypes(options.transactionTypes);
        setTagSuggestions(tags);
      } catch (error) {
        console.error('Error loading options:', error);
      } finally {
        setOptionsLoading(false);
      }

      if (!slug) return;
      try {
        const response = await fetch(`/api/listings/${slug}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          const l = result.data;
          
          // Restriction: No editing for pending or hidden listings
          if (l.status === 'Đang chờ duyệt' || l.status === 'Đã ẩn') {
            alert(`Tin đăng đang ở trạng thái "${l.status}", không thể chỉnh sửa.`);
            router.push("/tai-khoan");
            return;
          }

          setListingId(l.id);
          setTitle(l.title || "");
          setListingSlug(l.slug || "");
          setDescription(l.description || "");
          setTransactionTypeId(l.transaction_type_id || "");
          setPropertyTypeId(l.property_type_id || "");
          setProvince(l.province || "");
          setWard(l.ward || "");
          setAddress(l.address || "");
          setArea(l.area?.toString() || "");
          setPrice(l.price ? Number(l.price).toLocaleString('vi-VN') : "");
          setWidth(l.width?.toString() || "");
          setLength(l.length?.toString() || "");
          setDirection(l.direction || "");
          setContactName(l.contact_name || "");
          setContactPhone(l.contact_phone || "");
          setFloorCount(l.floor_count?.toString() || "");
          setBedroomCount(l.bedroom_count?.toString() || "");
          if (l.tags) {
            setSelectedHashTags(l.tags.map((t: any) => t.slug || t.name));
          }
          // Fetch images
          const imgRes = await fetch(`/api/attachments/${l.id}?target_type=listing`);
          const imgJson = await imgRes.json();
          if (imgJson.success) {
            setInitialImages(imgJson.data || []);
          }
        }
      } catch (error) {
        console.error('Lỗi lấy thông tin bài viết:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  const slugify = (text: string) => {
    return text.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/([^0-9a-z-\s])/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      setPrice('');
      return;
    }
    setPrice(Number(val).toLocaleString('vi-VN'));
  };

  const addTag = (tagToAdd?: string) => {
    const tag = (tagToAdd || tagInput).trim().replace(/^#/, "");
    if (tag && !selectedHashTags.includes(tag)) {
      setSelectedHashTags([...selectedHashTags, tag]);
    }
    setTagInput("");
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    setSelectedHashTags(selectedHashTags.filter(t => t !== tag));
  };

  const handleTagInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    
    if (value.trim().length > 0) {
      try {
        const localFiltered = tagSuggestions.filter(tag => tag.toLowerCase().includes(value.toLowerCase()) && !selectedHashTags.includes(tag));
        if (value.trim().length > 1) {
          const freshSuggestions = await getAllTagNamesAPI(value.trim());
          const filteredFresh = freshSuggestions.filter(tag => !selectedHashTags.includes(tag));
          setTagSuggestions(prev => [...new Set([...prev, ...filteredFresh])]);
        }
        setShowSuggestions(true);
      } catch (error) {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Files
  const handleRemoveApiImage = (id: string) => {
    setDeletedApiImages(prev => [...prev, id]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'));
    const totalRemainingAPI = initialImages.length - deletedApiImages.length;
    const newTotal = totalRemainingAPI + selectedFiles.length + validFiles.length;
    
    if (newTotal > 20) {
      alert(`Bạn chỉ được giữ tối đa 20 file. Vui lòng xóa bớt.`);
    } else {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
    if (e.target) e.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      alert("Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn.");
      return;
    }
    if (!listingId) return;

    setIsUploading(true);

    try {
      // 1. UPDATE LISTING INFO
      const updateData = {
        title,
        slug: listingSlug,
        description,
        transaction_type_id: transactionTypeId,
        property_type_id: propertyTypeId,
        province,
        ward,
        address,
        area: area ? parseFloat(area) : null,
        width: width ? parseFloat(width) : null,
        length: length ? parseFloat(length) : null,
        price: price ? price.replace(/\D/g, '') : null,
        direction,
        contact_name: contactName.trim() || null,
        contact_phone: contactPhone.trim() || null,
        floor_count: floorCount ? parseInt(floorCount) : null,
        bedroom_count: bedroomCount ? parseInt(bedroomCount) : null,
      };

      const res = await fetch(`/api/listings/${listingId}`, {
         method: 'PATCH', // Cần viết method PATCH bên kia hỗ trợ nhận full object update
         headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
         },
         body: JSON.stringify(updateData)
      });
      const dataJson = await res.json();
      if (!dataJson.success) {
         throw new Error(dataJson.error || "Update database failed");
      }

      // 2. TAGS: Client Side Update (We simply re-send the tags using the tag service client side helper if backend lacks it)
      if (selectedHashTags.length >= 0) {
        await processTagsForListingClient(selectedHashTags, listingId);
      }

      // 3. FILE UPLOAD 
      if (selectedFiles.length > 0) {
         await Promise.all(selectedFiles.map(file => uploadListingAttachments(file, listingId)));
         setSelectedFiles([]);
      }

      // 4. FIRE AND FORGET DELETIONS
      if (deletedApiImages.length > 0) {
         deletedApiImages.forEach(public_id => {
            deleteAttachment(public_id).catch(() => {});
         });
         setDeletedApiImages([]);
      }

      alert("Cập nhật bài đăng thành công!");
      router.push("/tai-khoan"); // Come back to accout profile

    } catch (error: any) {
      console.error(error);
      alert(error.message || "Có lỗi xảy ra khi cập nhật");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
     return <div className="min-h-screen flex text-center justify-center items-center py-20 text-slate-500 font-bold uppercase tracking-wider animate-pulse">Đang tải biểu mẫu...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="mb-8 flex flex-col gap-4">
          <button 
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors text-sm font-semibold w-fit"
          >
            <ArrowLeft className="size-4" />
            Quay lại
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Sửa bài đăng
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Chỉnh sửa các thông tin, hình ảnh và đặc điểm của tin đăng.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-6 md:p-10">
          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* 1. Loại giao dịch & BĐS */}
            <section className="space-y-6">
              <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-2">
                <span className="size-2 bg-emerald-600 rounded-full"></span>
                Thông tin cơ bản
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Loại giao dịch <span className="text-red-500">*</span></label>
                  <select
                    value={transactionTypeId}
                    onChange={(e) => setTransactionTypeId(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Chọn loại giao dịch</option>
                    {transactionTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Loại hình <span className="text-red-500">*</span></label>
                  <select
                    value={propertyTypeId}
                    onChange={(e) => setPropertyTypeId(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Chọn loại hình</option>
                    {propertyTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* 2. Vị trí */}
            <section className="space-y-6">
              <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-2">
                <span className="size-2 bg-emerald-600 rounded-full"></span>
                Vị trí
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <LocationSelector selectedProvince={province} onProvinceChange={setProvince} selectedWard={ward} onWardChange={setWard} />
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Địa chỉ cụ thể</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            </section>

            {/* 3. Chi tiết */}
            <section className="space-y-6">
              <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-2">
                <span className="size-2 bg-emerald-600 rounded-full"></span>
                Chi tiết bài đăng
              </h4>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Tiêu đề <span className="text-red-500">*</span></label>
                <input type="text" required value={title} onChange={(e) => { setTitle(e.target.value); setListingSlug(slugify(e.target.value)); }} className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Diện tích (m²) <span className="text-red-500">*</span></label>
                  <input type="number" required value={area} onChange={(e) => setArea(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg py-2.5 px-4 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Giá <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="text" required value={price} onChange={handlePriceChange} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg py-2.5 px-4 text-sm pr-12" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">VNĐ</span>
                  </div>
                </div>
                {showDimensions && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Ngang (m)</label>
                      <input type="number" step="0.1" value={width} onChange={(e) => setWidth(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg py-2.5 px-4 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Dài (m)</label>
                      <input type="number" step="0.1" value={length} onChange={(e) => setLength(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg py-2.5 px-4 text-sm" />
                    </div>
                  </>
                )}
                {showFloors && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Số tầng</label>
                    <input type="number" value={floorCount} onChange={(e) => setFloorCount(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg py-2.5 px-4 text-sm" />
                  </div>
                )}
                {showBedrooms && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Số phòng ngủ</label>
                    <input type="number" value={bedroomCount} onChange={(e) => setBedroomCount(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg py-2.5 px-4 text-sm" />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Hướng</label>
                  <select value={direction} onChange={(e) => setDirection(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg py-2.5 px-4 text-sm">
                    <option value="">Chọn Hướng</option>
                    <option value="Dong">Đông</option>
                    <option value="Tay">Tây</option>
                    <option value="Nam">Nam</option>
                    <option value="Bac">Bắc</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <label className="text-sm font-semibold">Hashtags</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedHashTags.map(tag => (
                    <span key={tag} className="inline-flex gap-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 text-xs font-bold border">
                      #{tag} <button type="button" onClick={() => removeTag(tag)}><X className="size-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type="text" value={tagInput} onChange={handleTagInputChange} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Ví dụ: chính-chủ..." className="w-full bg-slate-50 border py-2 px-4 rounded-lg text-sm" />
                    {showSuggestions && (
                      <div className="absolute top-12 w-full bg-white border shadow shadow-xl rounded-lg overflow-hidden z-20">
                         {tagSuggestions.filter(t => !selectedHashTags.includes(t)).slice(0, 5).map(t => (
                           <button type="button" key={t} onClick={() => addTag(t)} className="w-full text-left p-3 hover:bg-slate-100">#{t}</button>
                         ))}
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => addTag()} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold flex gap-2"><Plus className="size-4" /> Thêm</button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Mô tả chi tiết <span className="text-red-500">*</span></label>
                <div className="border rounded-lg overflow-hidden">
                  <RichTextEditor value={description} onChange={setDescription} />
                </div>
              </div>
            </section>

            {/* 4. Liên hệ */}
            <section className="space-y-6">
              <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-2">
                <span className="size-2 bg-emerald-600 rounded-full"></span>
                Thông tin liên hệ
              </h4>
              <p className="text-xs text-slate-500 -mt-4">
                Để trống nếu muốn dùng mặc định của tài khoản.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tên liên hệ</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Nhập tên liên hệ"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Số điện thoại liên hệ</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Nhập số điện thoại"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </section>

            {/* 4. Hình ảnh */}
            <section className="space-y-6">
              <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-2">
                <span className="size-2 bg-emerald-600 rounded-full"></span> Ảnh & Video (Tối đa 20 file)
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Đã chọn: {initialImages.length - deletedApiImages.length + selectedFiles.length}/20</span>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold">Thêm File</button>
                  <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Cũ (API) */}
                  {initialImages.filter(img => !deletedApiImages.includes(img.id)).map(img => (
                    <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border">
                      <img src={img.secure_url || img.url} alt="Listing File" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => handleRemoveApiImage(img.id)} className="absolute top-2 right-2 font-bold w-6 h-6 bg-red-500 text-white rounded-full text-xs">×</button>
                    </div>
                  ))}
                  {/* Mới (Local File) */}
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-emerald-400">
                       <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                       <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">Mới</span>
                       <button type="button" onClick={() => removeFile(idx)} className="absolute font-bold top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs">×</button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="pt-8 border-t flex gap-4">
              <button type="submit" disabled={isUploading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black py-4 rounded-xl shadow-lg transition-all tracking-widest text-sm uppercase">
                {isUploading ? "Đang lưu bài đăng..." : "Cập nhật bài đăng"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
