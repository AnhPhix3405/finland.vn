"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import UserRichTextEditor from "@/src/components/ui/UserRichTextEditor";
import LocationSelector from "@/src/components/feature/LocationSelector";
import MapPicker from "@/src/components/feature/MapPicker";
import { loadAllFormOptions, SelectOption } from "@/src/app/modules/form-options.service";
import { uploadListingAttachments, deleteAttachment } from "@/src/app/modules/upload.service";
import { getFeatureHashtags, FeatureHashtag } from "@/src/app/modules/property.service";
import { updateAttachmentSortOrder } from "@/src/app/modules/attachments.service";
import { fetchWithRetry } from "@/src/lib/api/fetch-with-retry";
import { useAuthStore } from "@/src/store/authStore";
import { useNotificationStore } from "@/src/store/notificationStore";

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
  sort_order?: number;
}

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const { accessToken } = useAuthStore();
  const addToast = useNotificationStore((state) => state.addToast);

  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [listingId, setListingId] = useState("");

  const [transactionTypeId, setTransactionTypeId] = useState("");
  const [propertyTypeId, setPropertyTypeId] = useState("");
  const [selectedFeatureHashtags, setSelectedFeatureHashtags] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  // Options loaded from API
  const [propertyTypes, setPropertyTypes] = useState<SelectOption[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<SelectOption[]>([]);
  const [featureHashtags, setFeatureHashtags] = useState<FeatureHashtag[]>([]);

  // Form data states
  const [title, setTitle] = useState("");
  const [listingSlug, setListingSlug] = useState("");
  const [province, setProvince] = useState("");
  const [ward, setWard] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [price, setPrice] = useState("");
  const [pricePerM2, setPricePerM2] = useState("");
  const [pricePerFrontageMeter, setPricePerFrontageMeter] = useState("");
  const [direction, setDirection] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [floorCount, setFloorCount] = useState("");
  const [bedroomCount, setBedroomCount] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // File states
  const [initialImages, setInitialImages] = useState<Attachment[]>([]);
  const [originalImages, setOriginalImages] = useState<Attachment[]>([]);
  const [deletedApiImages, setDeletedApiImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive property type for conditional rendering
  const selectedPropertyType = propertyTypes.find(pt => pt.id === propertyTypeId);

  const isApartment = selectedPropertyType?.hashtag === "chung-cu";
  const isHouse = ["nha-pho", "biet-thu", "shophouse", "nha-tro"].includes(selectedPropertyType?.hashtag || "");
  const isOffice = ["van-phong", "kho-xuong"].includes(selectedPropertyType?.hashtag || "");

  const showBedrooms = isHouse || isApartment;
  const showFloors = isHouse || isOffice;
  const showDimensions = !isApartment;

  const toggleFeatureHashtag = (id: string) => {
    setSelectedFeatureHashtags(prev => 
      prev.includes(id) 
        ? prev.filter(h => h !== id)
        : [...prev, id]
    );
  };

  // INITIAL LOAD - Optimized with parallel calls
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Parallel fetch: options, features, and listing
        const [options, featureResult, listingRes] = await Promise.all([
          loadAllFormOptions(),
          getFeatureHashtags({ limit: 100 }),
          slug && accessToken ? fetchWithRetry(`/api/listings/${slug}`, { token: accessToken || undefined, isAdmin: false }) : Promise.resolve(null)
        ]);

        setPropertyTypes(options.propertyTypes);
        setTransactionTypes(options.transactionTypes);
        if (featureResult.success && featureResult.data) {
          setFeatureHashtags(featureResult.data);
        }

        if (!slug || !listingRes) return;

        const result = await listingRes.json();

        if (result.success && result.data) {
          const l = result.data;

          // Restriction: No editing for pending or hidden listings
          if (l.status === 'Đang chờ duyệt' || l.status === 'Đã Ẩn') {
            addToast(`Tin đăng đang ở trạng thái "${l.status}", không thể chỉnh sửa.`, "error");
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
          setPricePerM2(l.price_per_m2?.toString() || "");
          setPricePerFrontageMeter(l.price_per_frontage_meter?.toString() || "");
          setDirection(l.direction || "");
          setContactName(l.contact_name || "");
          setContactPhone(l.contact_phone || "");
          setFloorCount(l.floor_count?.toString() || "");
          setBedroomCount(l.bedroom_count?.toString() || "");
          setLatitude(l.latitude ?? null);
          setLongitude(l.longitude ?? null);
          if (l.listing_feature_hashtags) {
            setSelectedFeatureHashtags(l.listing_feature_hashtags.map((fh: { feature_hashtag_id: string }) => fh.feature_hashtag_id));
          }

          // Fetch images in parallel with listing data
          const imgRes = await fetchWithRetry(`/api/attachments/${l.id}?target_type=listing`, {
            token: accessToken || undefined,
            isAdmin: false
          });
          const imgJson = await imgRes.json();
          if (imgJson.success) {
            const images = (imgJson.data || []).sort((a: Attachment, b: Attachment) => (a.sort_order || 0) - (b.sort_order || 0));
            setInitialImages(images);
            setOriginalImages(JSON.parse(JSON.stringify(images)));
          }
        }
      } catch (_error) {
        console.error('Lỗi lấy thông tin bài viết:', _error);
        addToast("Không thể tải thông tin bài viết", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, router, addToast]);

  const slugify = (text: string) => {
    return text.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/([^0-9a-z-\s])/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  };

  useEffect(() => {
    const query = [address, ward, province].filter(Boolean).join(', ');
    if (query.trim().length < 5) return;

    const delayDebounceFn = setTimeout(async () => {
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=vn&limit=1`
        );
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const [targetLng, targetLat] = data.features[0].center;
          setLatitude(targetLat);
          setLongitude(targetLng);
        }
      } catch (err) {
        console.error('Geocoding error:', err);
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [province, ward, address]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      setPrice('');
      return;
    }
    setPrice(Number(val).toLocaleString('vi-VN'));
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
      addToast(`Bạn chỉ được giữ tối đa 20 file. Vui lòng xóa bớt.`, "error");
    } else {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
    if (e.target) e.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedItem(null);
      return;
    }

    const newImages = [...initialImages];
    const draggedImage = newImages[draggedItem];
    newImages.splice(draggedItem, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    // Update sort_order based on new position
    const updatedImages = newImages.map((img, idx) => ({
      ...img,
      sort_order: idx
    }));

    setInitialImages(updatedImages);
    setDraggedItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      addToast("Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn.", "error");
      return;
    }
    if (!listingId) return;

    if (pricePerM2 && parseFloat(pricePerM2) <= 0) {
      addToast("Giá/m² phải lớn hơn 0", "error");
      return;
    }
    if (pricePerFrontageMeter && parseFloat(pricePerFrontageMeter) <= 0) {
      addToast("Giá/mặt tiền phải lớn hơn 0", "error");
      return;
    }

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
        price: price ? price.replace(/\D/g, '') : null,
        price_per_m2: pricePerM2 ? parseFloat(pricePerM2) : null,
        price_per_frontage_meter: pricePerFrontageMeter ? parseFloat(pricePerFrontageMeter) : null,
        direction,
        contact_name: contactName.trim() || null,
        contact_phone: contactPhone.trim() || null,
        floor_count: floorCount ? parseInt(floorCount) : null,
        bedroom_count: bedroomCount ? parseInt(bedroomCount) : null,
        latitude: latitude || null,
        longitude: longitude || null,
      };

      const res = await fetchWithRetry(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        token: accessToken || undefined,
        isAdmin: false,
        body: JSON.stringify(updateData)
      });
      const dataJson = await res.json();
      if (!dataJson.success) {
        throw new Error(dataJson.error || "Update database failed");
      }

      // 2. UPDATE FEATURE HASHTAGS
      // Delete existing and create new ones
      try {
        const deleteRes = await fetchWithRetry(`/api/listings/${listingId}/feature-hashtags`, {
          method: 'DELETE',
          token: accessToken || undefined,
          isAdmin: false
        });
        if (deleteRes.ok) {
          for (const featureId of selectedFeatureHashtags) {
            await fetchWithRetry(`/api/listings/${listingId}/feature-hashtags`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ feature_hashtag_id: featureId }),
              token: accessToken || undefined,
              isAdmin: false
            });
          }
        }
      } catch (err) {
        console.error('Error updating feature hashtags:', err);
      }

      // 2.5 UPDATE SORT ORDER FOR CHANGED IMAGES ONLY
      if (initialImages.length > 0) {
        const changedImages = initialImages.filter(img => {
          const original = originalImages.find(o => o.id === img.id);
          return !original || original.sort_order !== img.sort_order;
        });

        if (changedImages.length > 0) {
          await Promise.all(changedImages.map(img =>
            updateAttachmentSortOrder(img.id, img.sort_order || 0, accessToken)
          ));
        }
      }

      // 3. FILE UPLOAD 
      if (selectedFiles.length > 0) {
        await Promise.all(selectedFiles.map((file) =>
          uploadListingAttachments(file, listingId)
        ));
        setSelectedFiles([]);
      }

      // 4. FIRE AND FORGET DELETIONS
      if (deletedApiImages.length > 0) {
        deletedApiImages.forEach(public_id => {
          deleteAttachment(public_id).catch(() => { });
        });
        setDeletedApiImages([]);
      }

      addToast("Cập nhật bài đăng thành công!", "success");
      router.push("/tai-khoan"); // Come back to accout profile

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra khi cập nhật";
      const silentTokenErrors = ["Token không hợp lệ", "Token không tồn tại", "Vui lòng đăng nhập"];
      if (!silentTokenErrors.includes(message)) {
        addToast(message, "error");
      }
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
                <div className="w-120">
                  <LocationSelector selectedProvince={province} onProvinceChange={setProvince} selectedWard={ward} onWardChange={setWard} requiredProvince={true} requiredWard={true} />

                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Địa chỉ cụ thể</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="md:col-span-2 space-y-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Vị trí chính xác trên bản đồ</label>
                  <MapPicker
                    initialLat={latitude || undefined}
                    initialLng={longitude || undefined}
                    onLocationChange={(lat, lng) => {
                      setLatitude(lat);
                      setLongitude(lng);
                    }}
                  />
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
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Giá/m² (VNĐ)</label>
                  <input type="number" value={pricePerM2} onChange={(e) => setPricePerM2(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg py-2.5 px-4 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Giá/mặt tiền (VNĐ)</label>
                  <input type="number" value={pricePerFrontageMeter} onChange={(e) => setPricePerFrontageMeter(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg py-2.5 px-4 text-sm" />
                </div>
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
                    <option value="Đông">Đông</option>
                    <option value="Tây">Tây</option>
                    <option value="Nam">Nam</option>
                    <option value="Bắc">Bắc</option>
                  </select>
                </div>
              </div>

              {/* Feature Hashtags */}
              <div className="space-y-3">
                <label className="text-sm font-semibold">Đặc điểm nổi bật</label>
                {loading ? (
                  <div className="text-sm text-slate-500">Đang tải...</div>
                ) : featureHashtags.length === 0 ? (
                  <div className="text-sm text-slate-500">Chưa có đặc điểm nào</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {featureHashtags.map(feature => (
                      <button
                        key={feature.id}
                        type="button"
                        onClick={() => toggleFeatureHashtag(feature.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedFeatureHashtags.includes(feature.id)
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {feature.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Mô tả chi tiết <span className="text-red-500">*</span></label>
                <div className="border rounded-lg overflow-hidden">
                  <UserRichTextEditor value={description} onChange={setDescription} />
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
                  <span className="text-sm text-slate-600 dark:text-slate-400">Tổng: {(initialImages.length - deletedApiImages.length) + selectedFiles.length}/20 file</span>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors">+ Thêm ảnh/video</button>
                  <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />
                </div>

                <div className="space-y-4">
                  {/* Cũ (API) - Kéo để sắp xếp */}
                  {initialImages.filter(img => !deletedApiImages.includes(img.id)).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">Ảnh hiện tại (kéo để sắp xếp)</p>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {initialImages.filter(img => !deletedApiImages.includes(img.id)).map((img, idx) => (
                          <div
                            key={img.id}
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(idx)}
                            className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-move transition-all ${draggedItem === idx ? 'opacity-50 border-emerald-500' : 'border-slate-200 dark:border-slate-700'
                              }`}
                          >
                            <img src={img.secure_url || img.url} alt="Listing File" className="w-full h-full object-cover" />
                            {img.sort_order === 0 && (
                              <span className="absolute bottom-2 left-2 bg-emerald-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded">Chính</span>
                            )}
                            {img.sort_order !== 0 && (
                              <span className="absolute bottom-2 left-2 bg-slate-700 text-white text-[10px] uppercase font-bold px-2 py-1 rounded">#{img.sort_order || 0}</span>
                            )}
                            <button type="button" onClick={() => handleRemoveApiImage(img.id)} className="absolute top-2 right-2 font-bold w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600">×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mới (Local File) */}
                  {selectedFiles.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">Ảnh mới thêm</p>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {selectedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-emerald-400"
                          >
                            <img src={URL.createObjectURL(file)} alt="New file" className="w-full h-full object-cover" />
                            <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">Mới</span>
                            <button type="button" onClick={() => removeFile(idx)} className="absolute font-bold top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600">×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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