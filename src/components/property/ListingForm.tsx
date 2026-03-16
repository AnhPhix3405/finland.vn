"use client";

import { useState, useRef, useEffect } from "react";
import UserRichTextEditor from "../ui/UserRichTextEditor";
import { Camera, Plus, X, Check, Video } from "lucide-react";
import { createListing } from "@/src/app/modules/listings.service";
import { uploadListingAttachments } from "@/src/app/modules/upload.service";
import { getAllTagNamesAPI } from "@/src/app/modules/tags.service.client";
import { useUserStore } from "@/src/store/userStore";
import LocationSelector from "../feature/LocationSelector";
import { loadAllFormOptions, SelectOption } from "@/src/app/modules/form-options.service";

interface ListingFormProps {
  onSuccess?: () => void;
}

export function ListingForm({ onSuccess }: ListingFormProps) {
  const { user } = useUserStore();
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
  
  // Load options on component mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const options = await loadAllFormOptions();
        setPropertyTypes(options.propertyTypes);
        setTransactionTypes(options.transactionTypes);
        
        // Load tag suggestions
        const allTagNames = await getAllTagNamesAPI();
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
  const [width, setWidth] = useState("");
  const [length, setLength] = useState("");
  const [direction, setDirection] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [floorCount, setFloorCount] = useState("");
  const [bedroomCount, setBedroomCount] = useState("");

  // File states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // File handling functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file types (only images)
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));

    if (invalidFiles.length > 0) {
      alert(`${invalidFiles.length} file(s) bị loại bỏ vì không phải là ảnh`);
    }

    // Check total file limit
    const newTotalFiles = selectedFiles.length + validFiles.length;
    if (newTotalFiles > 20) {
      const allowedCount = 20 - selectedFiles.length;
      const trimmedFiles = validFiles.slice(0, allowedCount);
      alert(`Chỉ có thể tải lên tối đa 20 ảnh. Đã thêm ${trimmedFiles.length} ảnh.`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("Vui lòng đăng nhập để đăng bài");
      return;
    }

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
        width: width ? parseFloat(width) : undefined,
        length: length ? parseFloat(length) : undefined,
        price: price ? price.replace(/\D/g, '') : undefined,
        direction,
        broker_id: user.id,
        tags: selectedHashTags, // Include tags in the request
        contact_name: contactName.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
        floor_count: floorCount ? parseInt(floorCount) : undefined,
        bedroom_count: bedroomCount ? parseInt(bedroomCount) : undefined,
      });

      if (!listingResult.success) {
        alert(listingResult.error);
        return;
      }

      console.log("Listing created with ID:", listingResult.id);
      if (listingResult.tags && listingResult.tags.length > 0) {
        console.log(`Processed ${listingResult.tags.length} tags:`, listingResult.tags.map(t => t.name));
      }

      // Upload files if any
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(file =>
          uploadListingAttachments(file, listingResult.id)
        );

        const uploadResults = await Promise.all(uploadPromises);
        console.log("Upload results:", uploadResults);
      }

      const successMessage = listingResult.tags && listingResult.tags.length > 0 
        ? `Đăng bài thành công! Đã tạo/gắn ${listingResult.tags.length} hashtags.`
        : "Đăng bài thành công!";
      
      alert(successMessage);
      onSuccess?.();

    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Có lỗi xảy ra khi đăng bài");
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
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Loại giao dịch <span className="text-red-500">*</span>
            </label>
            {optionsLoading ? (
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg py-3 px-4 text-sm text-slate-500">
                Đang tải...
              </div>
            ) : (
              <select
                value={transactionTypeId}
                onChange={(e) => setTransactionTypeId(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-900 dark:text-white"
              >
                <option value="">Chọn loại giao dịch</option>
                {transactionTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            )}
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
                onChange={(e) => setPropertyTypeId(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-900 dark:text-white"
              >
                <option value="">Chọn loại hình</option>
                {propertyTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            )}
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
          <LocationSelector
            selectedProvince={province}
            onProvinceChange={setProvince}
            selectedWard={ward}
            onWardChange={setWard}
          />
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
        </div>
      </section>

      {/* 3. Chi tiết bài đăng */}
      <section className="space-y-6">
        <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-2">
          <span className="size-2 bg-emerald-600 rounded-full"></span>
          Chi tiết bài đăng
        </h4>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tiêu đề <span className="text-red-500">*</span></label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Bán nhà phố mặt tiền kinh doanh Quận 1, sổ hồng riêng"
            className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Diện tích (m²) <span className="text-red-500">*</span></label>
            <input
              type="number"
              required
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {selectedTransactionType?.hashtag === "cho-thue" ? "Giá thuê/tháng" : "Tổng giá"} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white pr-16"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">VNĐ</span>
            </div>
          </div>

          {showDimensions && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Chiều ngang (m)</label>
                <input
                  type="number"
                  step="0.1"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Chiều dài (m)</label>
                <input
                  type="number"
                  step="0.1"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
            </>
          )}

          {showFloors && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Số tầng</label>
              <input type="number" value={floorCount} onChange={(e) => setFloorCount(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white" />
            </div>
          )}

          {showBedrooms && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Số phòng ngủ</label>
              <input type="number" value={bedroomCount} onChange={(e) => setBedroomCount(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white" />
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
              <option value="Dong">Đông</option>
              <option value="Tay">Tây</option>
              <option value="Nam">Nam</option>
              <option value="Bac">Bắc</option>
              <option value="Dong Bac">Đông Bắc</option>
              <option value="Dong Nam">Đông Nam</option>
              <option value="Tay Bac">Tây Bắc</option>
              <option value="Tay Nam">Tây Nam</option>
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
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            <UserRichTextEditor
              value={description}
              onChange={setDescription}
            />
          </div>
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
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Số điện thoại liên hệ</label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder={user?.phone || "Để trống để dùng SĐT tài khoản"}
              className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
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