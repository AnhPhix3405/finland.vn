"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import UserRichTextEditor from "../ui/UserRichTextEditor";
import { Camera, Plus, X, Check, Video } from "lucide-react";
import { createListing } from "@/src/app/modules/listings.service";
import { uploadListingAttachments } from "@/src/app/modules/upload.service";
import { getAllTagNamesAPI } from "@/src/app/modules/tags.service.client";
import { useUserStore } from "@/src/store/userStore";
import { useAuthStore } from "@/src/store/authStore";
import { useNotificationStore } from "@/src/store/notificationStore";
import LocationSelector from "../feature/LocationSelector";
import MapPicker from "../feature/MapPicker";
import { loadAllFormOptions, SelectOption } from "@/src/app/modules/form-options.service";

interface ListingFormProps {
  onSuccess?: () => void;
}

export function ListingForm({ onSuccess }: ListingFormProps) {
  const router = useRouter();
  const { user } = useUserStore();
  const accessToken = useAuthStore((state) => state.accessToken);
  const addToast = useNotificationStore((state) => state.addToast);
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

  // Load options on component mount - Optimized with parallel calls
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [options, allTagNames] = await Promise.all([
          loadAllFormOptions(),
          getAllTagNamesAPI()
        ]);
        setPropertyTypes(options.propertyTypes);
        setTransactionTypes(options.transactionTypes);
        setTagSuggestions(allTagNames);
      } catch (error) {
        console.error('Error loading form options:', error);
      } finally {
        setOptionsLoading(false);
      }
    };
    loadOptions();
  }, []);

  // Form data states
  const [title, setTitle] = useState("");
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Derive property type for conditional rendering
  const selectedPropertyType = propertyTypes.find(pt => pt.id === propertyTypeId);
  const selectedTransactionType = transactionTypes.find(tt => tt.id === transactionTypeId);

  const isApartment = selectedPropertyType?.hashtag === "chung-cu";
  const isLand = selectedPropertyType?.hashtag === "dat-nen";
  const isHouse = ["nha-pho", "biet-thu", "shophouse", "nha-tro"].includes(selectedPropertyType?.hashtag || "");
  const isOffice = ["van-phong", "kho-xuong"].includes(selectedPropertyType?.hashtag || "");

  const showBedrooms = isHouse || isApartment;
  const showFloors = isHouse || isOffice;
  const showDimensions = !isApartment;

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

    // Filter and fetch suggestions based on input
    if (value.trim().length > 0) {
      try {
        // First show local filtered suggestions immediately 
        const localFiltered = tagSuggestions.filter(tag =>
          tag.toLowerCase().includes(value.toLowerCase()) &&
          !selectedHashTags.includes(tag)
        );

        // Then fetch fresh suggestions from API if the input is meaningful
        if (value.trim().length > 1) {
          const freshSuggestions = await getAllTagNamesAPI(value.trim());
          const filteredFresh = freshSuggestions.filter(tag =>
            !selectedHashTags.includes(tag)
          );

          // Merge and deduplicate 
          const combined = [...new Set([...localFiltered, ...filteredFresh])];
          setTagSuggestions(prev => {
            const newSuggestions = [...new Set([...prev, ...filteredFresh])];
            return newSuggestions;
          });
        }

        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching tag suggestions:', error);
        // Fallback to local filtering
        const filtered = tagSuggestions.filter(tag =>
          tag.toLowerCase().includes(value.toLowerCase()) &&
          !selectedHashTags.includes(tag)
        );
        setShowSuggestions(filtered.length > 0);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // Automatic geocoding based on address
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

  // Auto-calculate price per m2
  useEffect(() => {
    const priceValue = price.replace(/\D/g, '');
    if (priceValue && area && parseFloat(area) > 0) {
      const calculated = Math.round(parseInt(priceValue) / parseFloat(area));
      setPricePerM2(calculated.toString());
    }
  }, [price, area]);

  // File handling functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file types (only images)
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));

    if (invalidFiles.length > 0) {
      addToast(`${invalidFiles.length} file(s) bị loại bỏ vì không phải là ảnh`, "error");
    }

    // Check total file limit
    const newTotalFiles = selectedFiles.length + validFiles.length;
    if (newTotalFiles > 20) {
      const allowedCount = 20 - selectedFiles.length;
      const trimmedFiles = validFiles.slice(0, allowedCount);
      addToast(`Chỉ có thể tải lên tối đa 20 ảnh. Đã thêm ${trimmedFiles.length} ảnh.`, "info");
      setSelectedFiles(prev => [...prev, ...trimmedFiles]);
    } else {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }

    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): string | null => {
    const newErrors: Record<string, string> = {};
    const priceValue = price.replace(/\D/g, '');

    if (!transactionTypeId) {
      newErrors.transactionType = "Vui lòng chọn loại giao dịch";
    }

    if (!propertyTypeId) {
      newErrors.propertyType = "Vui lòng chọn loại bất động sản";
    }

    if (!province) {
      newErrors.province = "Vui lòng chọn Tỉnh/Thành phố";
    }

    if (!ward) {
      newErrors.ward = "Vui lòng chọn Phường/Xã";
    }

    if (!title.trim()) {
      newErrors.title = "Tiêu đề là bắt buộc";
    } else if (title.trim().length < 10) {
      newErrors.title = "Tiêu đề phải có ít nhất 10 ký tự";
    } else if (title.trim().length > 200) {
      newErrors.title = "Tiêu đề không được quá 200 ký tự";
    }

    if (!description.trim()) {
      newErrors.description = "Mô tả là bắt buộc";
    } else if (description.trim().length < 50) {
      newErrors.description = "Mô tả phải có ít nhất 50 ký tự";
    } else if (description.trim().length > 10000) {
      newErrors.description = "Mô tả không được quá 10000 ký tự";
    }

    if (!area) {
      newErrors.area = "Diện tích là bắt buộc";
    } else {
      const areaNum = parseFloat(area);
      if (isNaN(areaNum) || areaNum <= 0) {
        newErrors.area = "Diện tích phải là số dương";
      } else if (areaNum > 1000000) {
        newErrors.area = "Diện tích không hợp lệ";
      }
    }

    if (!priceValue || parseInt(priceValue) === 0) {
      newErrors.price = "Giá là bắt buộc";
    } else {
      const priceNum = parseInt(priceValue);
      if (priceNum < 100000) {
        newErrors.price = "Giá phải lớn hơn 100,000 VNĐ";
      } else if (priceNum > 100000000000) {
        newErrors.price = "Giá không hợp lệ";
      }
    }

    if (pricePerM2) {
      const pricePerM2Num = parseFloat(pricePerM2);
      if (isNaN(pricePerM2Num) || pricePerM2Num <= 0) {
        newErrors.pricePerM2 = "Giá/m² phải lớn hơn 0";
      }
    }

    if (pricePerFrontageMeter) {
      const pricePerFrontageMeterNum = parseFloat(pricePerFrontageMeter);
      if (isNaN(pricePerFrontageMeterNum) || pricePerFrontageMeterNum <= 0) {
        newErrors.pricePerFrontageMeter = "Giá/mặt tiền phải lớn hơn 0";
      }
    }

    if (floorCount) {
      const floorNum = parseInt(floorCount);
      if (isNaN(floorNum) || floorNum < 1 || floorNum > 100) {
        newErrors.floorCount = "Số tầng không hợp lệ";
      }
    }

    if (bedroomCount) {
      const bedroomNum = parseInt(bedroomCount);
      if (isNaN(bedroomNum) || bedroomNum < 0 || bedroomNum > 100) {
        newErrors.bedroomCount = "Số phòng ngủ không hợp lệ";
      }
    }

    if (contactPhone.trim()) {
      const phoneRegex = /^0[0-9]{9}$/;
      if (!phoneRegex.test(contactPhone.trim())) {
        newErrors.contactPhone = "Số điện thoại không hợp lệ";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length > 0 ? Object.keys(newErrors)[0] : null;
  };

  const scrollToError = (firstErrorKey: string | null) => {
    if (!firstErrorKey) return;

    const idMap: Record<string, string> = {
      transactionType: 'transactionType',
      propertyType: 'propertyType',
      province: 'projectCity',
      ward: 'projectDistrict',
      title: 'title',
      description: 'description',
      area: 'area',
      price: 'price',
      width: 'width',
      length: 'length',
      floorCount: 'floorCount',
      bedroomCount: 'bedroomCount',
      contactPhone: 'contactPhone',
    };

    const elementId = idMap[firstErrorKey];
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      addToast("Vui lòng đăng nhập để đăng bài", "error");
      return;
    }

    const firstErrorKey = validateForm();
    if (firstErrorKey) {
      scrollToError(firstErrorKey);
      return;
    }

    setErrors({});
    setIsUploading(true);

    try {
      // Create listing (slug is generated on server)
      const listingResult = await createListing({
        title,
        description,
        transaction_type_id: transactionTypeId,
        property_type_id: propertyTypeId,
        province,
        ward,
        address,
        area: area ? parseFloat(area) : undefined,
        price: price ? price.replace(/\D/g, '') : undefined,
        price_per_m2: pricePerM2 ? parseFloat(pricePerM2) : undefined,
        price_per_frontage_meter: pricePerFrontageMeter ? parseFloat(pricePerFrontageMeter) : undefined,
        direction,
        broker_id: user.id,
        tags: selectedHashTags, // Include tags in the request
        contact_name: contactName.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
        floor_count: floorCount ? parseInt(floorCount) : undefined,
        bedroom_count: bedroomCount ? parseInt(bedroomCount) : undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
      });

      if (!listingResult.success) {
        const errorMsg = listingResult.error || "Có lỗi xảy ra";

        if (errorMsg === "Phiên đăng nhập hết hạn") {
          useAuthStore.getState().clearAuth();
          addToast("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại", "error");
          router.push('/dang-nhap');
          return;
        }

        // Check if it's a validation error (missing required fields)
        if (errorMsg.toLowerCase().includes("thiếu") || errorMsg.toLowerCase().includes("bắt buộc") || errorMsg.toLowerCase().includes("required") || errorMsg.toLowerCase().includes("missing")) {
          // Try to find and scroll to the first missing field
          const fieldIds = ['transactionType', 'propertyType', 'title', 'area', 'price', 'projectCity'];
          const scrollAndFocus = () => {
            for (const fieldId of fieldIds) {
              const element = document.getElementById(fieldId);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => {
                  (element as HTMLInputElement).focus();
                  element.classList.add('ring-2', 'ring-red-500');
                  setTimeout(() => element.classList.remove('ring-2', 'ring-red-500'), 2000);
                }, 100);
                return true;
              }
            }
            return false;
          };

          // Try immediately, if not found wait for DOM
          if (!scrollAndFocus()) {
            setTimeout(scrollAndFocus, 100);
          }
        }

        addToast(errorMsg, "error");
        return;
      }

      console.log("Listing created with ID:", listingResult.id);
      if (listingResult.tags && listingResult.tags.length > 0) {
        console.log(`Processed ${listingResult.tags.length} tags:`, listingResult.tags.map(t => t.name));
      }

      // Upload files sequentially to ensure correct sort_order
      if (selectedFiles.length > 0) {
        console.log("Uploading files, selectedFiles.length:", selectedFiles.length);
        const uploadResults = [];
        for (let i = 0; i < selectedFiles.length; i++) {
          console.log("Upload file index:", i);
          const result = await uploadListingAttachments(selectedFiles[i], listingResult.id, accessToken ?? undefined, i);
          uploadResults.push(result);
        }
        console.log("Upload results:", uploadResults);

        // Update listing thumbnail_url with first image (sort_order = 0)
        if (uploadResults.length > 0 && uploadResults[0]?.secure_url) {
          try {
            const response = await fetch(`/api/listings/${listingResult.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
              },
              body: JSON.stringify({ thumbnail_url: uploadResults[0].secure_url })
            });
            console.log('Thumbnail update response:', response.status);
          } catch (err) {
            console.error('Error updating thumbnail:', err);
          }
        }
      }

      const successMessage = "Đăng bài thành công!";

      addToast(successMessage, "success");
      onSuccess?.();

    } catch (error) {
      console.error("Error submitting form:", error);
      addToast("Có lỗi xảy ra khi đăng bài", "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      {/* 1. Loại giao dịch & Loại BĐS */}
      <section className="space-y-6">
        <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-2">
          <span className="size-2 bg-emerald-600 rounded-full"></span>
          Thông tin cơ bản
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="transactionType" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Loại giao dịch <span className="text-red-500">*</span>
            </label>
            {optionsLoading ? (
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg py-3 px-4 text-sm text-slate-500">
                Đang tải...
              </div>
            ) : (
              <select
                id="transactionType"
                value={transactionTypeId}
                onChange={(e) => {
                  setTransactionTypeId(e.target.value);
                  setErrors(prev => ({ ...prev, transactionType: '' }));
                }}
                required
                className={`w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-900 dark:text-white ${errors.transactionType ? 'border-red-500 ring-2 ring-red-500' : ''}`}
              >
                <option value="">Chọn loại giao dịch</option>
                {transactionTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            )}
            {errors.transactionType && <p className="text-red-500 text-xs mt-1">{errors.transactionType}</p>}
          </div>

          <div>
            <label htmlFor="propertyType" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Loại bất động sản <span className="text-red-500">*</span>
            </label>
            {optionsLoading ? (
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg py-3 px-4 text-sm text-slate-500">
                Đang tải...
              </div>
            ) : (
              <select
                id="propertyType"
                value={propertyTypeId}
                onChange={(e) => {
                  setPropertyTypeId(e.target.value);
                  setErrors(prev => ({ ...prev, propertyType: '' }));
                }}
                required
                className={`w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-900 dark:text-white ${errors.propertyType ? 'border-red-500 ring-2 ring-red-500' : ''}`}
              >
                <option value="">Chọn loại hình</option>
                {propertyTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            )}
            {errors.propertyType && <p className="text-red-500 text-xs mt-1">{errors.propertyType}</p>}
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
            <LocationSelector
              selectedProvince={province}
              onProvinceChange={(val) => { setProvince(val); setErrors(prev => ({ ...prev, province: '' })); }}
              selectedWard={ward}
              onWardChange={(val) => { setWard(val); setErrors(prev => ({ ...prev, ward: '' })); }}
              requiredProvince={true}
              requiredWard={true}
            />
          </div>
          {(errors.province || errors.ward) && (
            <div className="md:col-span-2">
              <p className="text-red-500 text-xs">{errors.province || errors.ward}</p>
            </div>
          )}
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Địa chỉ cụ thể</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ví dụ: 123 Nguyễn Huệ, Phường Bến Nghé"
              className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Map Picker */}
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

      {/* 3. Chi tiết bài đăng */}
      <section className="space-y-6">
        <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-2">
          <span className="size-2 bg-emerald-600 rounded-full"></span>
          Chi tiết bài đăng
        </h4>
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tiêu đề <span className="text-red-500">*</span></label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => { setTitle(e.target.value); setErrors(prev => ({ ...prev, title: '' })); }}
            placeholder="Ví dụ: Bán nhà phố mặt tiền kinh doanh Quận 1, sổ hồng riêng"
            className={`w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white ${errors.title ? 'border-red-500 ring-2 ring-red-500' : ''}`}
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label htmlFor="area" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Diện tích (m²) <span className="text-red-500">*</span></label>
            <input
              id="area"
              type="number"
              required
              value={area}
              onChange={(e) => { setArea(e.target.value); setErrors(prev => ({ ...prev, area: '' })); }}
              className={`w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white ${errors.area ? 'border-red-500 ring-2 ring-red-500' : ''}`}
            />
            {errors.area && <p className="text-red-500 text-xs mt-1">{errors.area}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="price" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {selectedTransactionType?.hashtag === "cho-thue" ? "Giá thuê/tháng" : "Tổng giá"} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="price"
                type="text"
                required
                value={price}
                onChange={(e) => { setPrice(e.target.value); setErrors(prev => ({ ...prev, price: '' })); }}
                className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white pr-16"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">VNĐ</span>
            </div>
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="pricePerM2" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Giá/m² (VNĐ)</label>
            <input
              id="pricePerM2"
              type="number"
              value={pricePerM2}
              onChange={(e) => { setPricePerM2(e.target.value); setErrors(prev => ({ ...prev, pricePerM2: '' })); }}
              className={`w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white ${errors.pricePerM2 ? 'border-red-500 ring-2 ring-red-500' : ''}`}
            />
            {errors.pricePerM2 && <p className="text-red-500 text-xs mt-1">{errors.pricePerM2}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="pricePerFrontageMeter" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Giá/mặt tiền (VNĐ)</label>
            <input
              id="pricePerFrontageMeter"
              type="number"
              value={pricePerFrontageMeter}
              onChange={(e) => { setPricePerFrontageMeter(e.target.value); setErrors(prev => ({ ...prev, pricePerFrontageMeter: '' })); }}
              className={`w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white ${errors.pricePerFrontageMeter ? 'border-red-500 ring-2 ring-red-500' : ''}`}
            />
            {errors.pricePerFrontageMeter && <p className="text-red-500 text-xs mt-1">{errors.pricePerFrontageMeter}</p>}
          </div>

          {showFloors && (
            <div className="space-y-2">
              <label htmlFor="floorCount" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Số tầng</label>
              <input
                id="floorCount"
                type="number"
                value={floorCount}
                onChange={(e) => { setFloorCount(e.target.value); setErrors(prev => ({ ...prev, floorCount: '' })); }}
                className={`w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white ${errors.floorCount ? 'border-red-500 ring-2 ring-red-500' : ''}`}
              />
              {errors.floorCount && <p className="text-red-500 text-xs mt-1">{errors.floorCount}</p>}
            </div>
          )}

          {showBedrooms && (
            <div className="space-y-2">
              <label htmlFor="bedroomCount" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Số phòng ngủ</label>
              <input
                id="bedroomCount"
                type="number"
                value={bedroomCount}
                onChange={(e) => { setBedroomCount(e.target.value); setErrors(prev => ({ ...prev, bedroomCount: '' })); }}
                className={`w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white ${errors.bedroomCount ? 'border-red-500 ring-2 ring-red-500' : ''}`}
              />
              {errors.bedroomCount && <p className="text-red-500 text-xs mt-1">{errors.bedroomCount}</p>}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Hướng cửa</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            >
              <option value="">Chọn hướng</option>
              <option value="Đông">Đông</option>
              <option value="Tây">Tây</option>
              <option value="Nam">Nam</option>
              <option value="Bắc">Bắc</option>
              <option value="Đông Bắc">Đông Bắc</option>
              <option value="Đông Nam">Đông Nam</option>
              <option value="Tây Bắc">Tây Bắc</option>
              <option value="Tây Nam">Tây Nam</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Hashtags (Đặc điểm nổi bật)</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedHashTags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-emerald-900 dark:hover:text-emerald-200 p-0.5"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">#</span>
              <input
                type="text"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleKeyPress}
                onFocus={() => tagInput && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Ví dụ: chính-chủ, mặt-tiền..."
                className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2 px-7 text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />

              {/* Tag Suggestions Dropdown */}
              {showSuggestions && tagInput && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
                  {tagSuggestions
                    .filter(tag =>
                      tag.toLowerCase().includes(tagInput.toLowerCase()) &&
                      !selectedHashTags.includes(tag)
                    )
                    .slice(0, 5) // Limit to 5 suggestions
                    .map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => addTag(tag)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white"
                      >
                        #{tag}
                      </button>
                    ))
                  }
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => addTag()}
              className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <Plus className="size-4" />
              Thêm
            </button>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Ấn Enter để thêm hashtag nhanh</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mô tả chi tiết <span className="text-red-500">*</span></label>
          <div className={`bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden border ${errors.description ? 'border-red-500 ring-2 ring-red-500' : 'border-slate-200 dark:border-slate-700'}`}>
            <UserRichTextEditor
              value={description}
              onChange={(val) => { setDescription(val); setErrors(prev => ({ ...prev, description: '' })); }}
            />
          </div>
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>
      </section>

      {/* 4. Thông tin liên hệ */}
      <section className="space-y-6">
        <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-2">
          <span className="size-2 bg-emerald-600 rounded-full"></span>
          Thông tin liên hệ
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 -mt-4">
          Để trống để dùng thông tin tài khoản của bạn ({user?.full_name} · {user?.phone}).
          Điền vào nếu muốn hiển thị thông tin liên hệ khác.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tên liên hệ</label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder={user?.full_name || "Để trống để dùng tên tài khoản"}
              className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="contactPhone" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Số điện thoại liên hệ</label>
            <input
              id="contactPhone"
              type="tel"
              value={contactPhone}
              onChange={(e) => { setContactPhone(e.target.value); setErrors(prev => ({ ...prev, contactPhone: '' })); }}
              placeholder={user?.phone || "Để trống để dùng SĐT tài khoản"}
              className={`w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white ${errors.contactPhone ? 'border-red-500 ring-2 ring-red-500' : ''}`}
            />
            {errors.contactPhone && <p className="text-red-500 text-xs mt-1">{errors.contactPhone}</p>}
          </div>
        </div>
      </section>

      {/* 5. Hình ảnh & Video */}
      <section className="space-y-6">
        <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-2">
          <span className="size-2 bg-emerald-600 rounded-full"></span>
          Ảnh & Video thực tế (Tối đa 20 file)
        </h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Đã chọn: {selectedFiles.length}/20 ảnh
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
            >
              Chọn ảnh
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {selectedFiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors flex items-center justify-center"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 truncate">
                    {file.name}
                  </div>
                </div>
              ))}

              {selectedFiles.length < 20 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className="size-8 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800 transition-colors">
                    <span className="text-emerald-600 dark:text-emerald-400 text-lg font-bold">+</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 text-center">Thêm ảnh</span>
                </div>
              )}
            </div>
          )}

          {selectedFiles.length === 0 && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-video rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
            >
              <div className="size-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800 transition-colors">
                <Camera className="size-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Chọn ảnh để tải lên</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Tối đa 20 ảnh</div>
              </div>
            </div>
          )}
        </div>
        <p className="text-[10px] text-slate-400 italic">Lưu ý: Bạn có thể chọn nhiều ảnh và video cùng lúc. Định dạng hỗ trợ: jpg, png, mp4, mov.</p>
      </section>

      {/* Submit Button */}
      <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex gap-4">
        <button
          type="submit"
          disabled={isUploading}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all uppercase tracking-widest text-sm"
        >
          {isUploading ? "Đang xử lý..." : "Đăng bài ngay"}
        </button>
      </div>
    </form>
  );
}