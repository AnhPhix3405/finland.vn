"use client";

import React, { useState, useEffect } from "react";
import { 
  getPropertyTypes, createPropertyType, updatePropertyType, deletePropertyType, PropertyType,
  getTransactionTypes, createTransactionType, updateTransactionType, deleteTransactionType, TransactionType  
} from "@/src/app/modules/property.service";

type HashtagType = 'property' | 'transaction';
type HashtagItem = PropertyType | TransactionType;

interface HashtagSystemManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HashtagSystemManagerModal({ isOpen, onClose }: HashtagSystemManagerModalProps) {
  const [currentType, setCurrentType] = useState<HashtagType>('property');
  const [items, setItems] = useState<HashtagItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemHashtag, setNewItemHashtag] = useState('');
  const [hashtagPreview, setHashtagPreview] = useState('');
  const [editingItem, setEditingItem] = useState<HashtagItem | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Hàm tạo hashtag từ name
  const generateHashtag = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen, currentType]);

  // Update hashtag preview when name changes
  useEffect(() => {
    if (newItemName && !newItemHashtag) {
      const preview = generateHashtag(newItemName);
      setHashtagPreview(preview);
    } else {
      setHashtagPreview('');
    }
  }, [newItemName, newItemHashtag]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      let result;
      if (currentType === 'property') {
        result = await getPropertyTypes({ limit: 100 });
      } else {
        result = await getTransactionTypes({ limit: 100 });
      }
      
      if (result.success) {
        setItems(result.data || []);
      } else {
        setToast({ message: result.error || 'Lỗi khi tải danh sách', type: 'error' });
      }
    } catch (error) {
      const typeName = currentType === 'property' ? 'loại hình BĐS' : 'loại hình giao dịch';
      setToast({ message: `Lỗi khi tải danh sách ${typeName}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newItemName.trim()) {
      const typeName = currentType === 'property' ? 'loại hình BĐS' : 'loại hình giao dịch';
      setToast({ message: `Vui lòng nhập tên ${typeName}`, type: 'error' });
      return;
    }

    const finalHashtag = newItemHashtag.trim() || hashtagPreview;
    const typeName = currentType === 'property' ? 'loại hình BĐS' : 'loại hình giao dịch';

    try {
      let result;
      if (currentType === 'property') {
        result = await createPropertyType({ 
          name: newItemName.trim(),
          hashtag: finalHashtag
        });
      } else {
        result = await createTransactionType({ 
          name: newItemName.trim(),
          hashtag: finalHashtag
        });
      }
      
      if (result.success) {
        setToast({ message: `Tạo ${typeName} thành công`, type: 'success' });
        setNewItemName('');
        setNewItemHashtag('');
        setHashtagPreview('');
        fetchItems();
      } else {
        setToast({ message: result.error || `Lỗi khi tạo ${typeName}`, type: 'error' });
      }
    } catch (error) {
      setToast({ message: `Lỗi khi tạo ${typeName}`, type: 'error' });
    }
  };

  const handleUpdate = async (id: string, name: string, hashtag?: string) => {
    if (!name.trim()) {
      const typeName = currentType === 'property' ? 'loại hình BĐS' : 'loại hình giao dịch';
      setToast({ message: `Vui lòng nhập tên ${typeName}`, type: 'error' });
      return;
    }

    try {
      let result;
      if (currentType === 'property') {
        result = await updatePropertyType({ 
          id, 
          name: name.trim(),
          hashtag: hashtag?.trim() || generateHashtag(name.trim())
        });
      } else {
        result = await updateTransactionType({ 
          id, 
          name: name.trim(),
          hashtag: hashtag?.trim() || generateHashtag(name.trim())
        });
      }
      
      if (result.success) {
        setToast({ message: 'Cập nhật thành công', type: 'success' });
        setEditingItem(null);
        fetchItems();
      } else {
        setToast({ message: result.error || 'Lỗi khi cập nhật', type: 'error' });
      }
    } catch (error) {
      const typeName = currentType === 'property' ? 'loại hình BĐS' : 'loại hình giao dịch';
      setToast({ message: `Lỗi khi cập nhật ${typeName}`, type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    const typeName = currentType === 'property' ? 'loại hình BĐS' : 'loại hình giao dịch';
    if (!confirm(`Bạn có chắc chắn muốn xóa ${typeName} này?`)) return;

    try {
      let result;
      if (currentType === 'property') {
        result = await deletePropertyType(id);
      } else {
        result = await deleteTransactionType(id);
      }
      
      if (result.success) {
        setToast({ message: 'Xóa thành công', type: 'success' });
        fetchItems();
      } else {
        setToast({ message: result.error || 'Lỗi khi xóa', type: 'error' });
      }
    } catch (error) {
      setToast({ message: `Lỗi khi xóa ${typeName}`, type: 'error' });
    }
  };

  // Reset form when changing type
  const handleTypeChange = (newType: HashtagType) => {
    setCurrentType(newType);
    setNewItemName('');
    setNewItemHashtag('');
    setHashtagPreview('');
    setEditingItem(null);
  };

  if (!isOpen) return null;

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-sm shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">tag</span>
            Quản lý hashtag hệ thống
          </h3>
          <button
            onClick={onClose}
            aria-label="Đóng modal"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        {/* Type Selector */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Chọn loại hashtag:
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleTypeChange('property')}
              className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                currentType === 'property'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
              }`}
            >
              Loại hình BĐS
            </button>
            <button
              onClick={() => handleTypeChange('transaction')}
              className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                currentType === 'transaction'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
              }`}
            >
              Loại hình giao dịch
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label htmlFor="item-name" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Tên {currentType === 'property' ? 'loại hình BĐS' : 'loại hình giao dịch'}
              </label>
              <input
                id="item-name"
                name="itemName"
                type="text"
                autoComplete="off"
                placeholder={currentType === 'property' ? "VD: Nhà phố, Chung cư..." : "VD: Mua bán, Cho thuê..."}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleCreate)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="item-hashtag" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Hashtag</label>
              <input
                id="item-hashtag"
                name="itemHashtag"
                type="text"
                autoComplete="off"
                placeholder={hashtagPreview || "Để trống để tự tạo..."}
                value={newItemHashtag}
                onChange={(e) => setNewItemHashtag(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleCreate)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 dark:text-white"
              />
            </div>
          </div>
          {hashtagPreview && !newItemHashtag && (
            <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-sm">
              <span className="text-xs text-amber-700 dark:text-amber-300">Preview hashtag: </span>
              <span className="text-xs font-mono text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
                #{hashtagPreview}
              </span>
            </div>
          )}
          <div className="flex justify-end">
            <button 
              onClick={handleCreate}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-4 py-2 rounded-sm text-sm font-bold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
            >
              {loading ? 'Đang tạo...' : 'Thêm mới'}
            </button>
          </div>
        </div>

        <div className="p-0 overflow-y-auto flex-1 overscroll-contain">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 sticky top-0">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tên {currentType === 'property' ? 'loại hình BĐS' : 'loại hình giao dịch'}
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hashtag</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined animate-spin mx-auto">progress_activity</span>
                    <div className="mt-2">Đang tải...</div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    Chưa có {currentType === 'property' ? 'loại hình BĐS' : 'loại hình giao dịch'} nào
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 text-sm">
                      {editingItem?.id === item.id ? (
                        <input
                          type="text"
                          value={editingItem.name}
                          onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                          onKeyPress={(e) => handleKeyPress(e, () => handleUpdate(editingItem.id, editingItem.name, editingItem.hashtag || ''))}
                          onBlur={() => setEditingItem(null)}
                          autoFocus
                          className="w-full px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-white"
                        />
                      ) : (
                        <span className="font-medium text-slate-900 dark:text-slate-100">{item.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingItem?.id === item.id ? (
                        <input
                          type="text"
                          value={editingItem.hashtag || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, hashtag: e.target.value })}
                          onKeyPress={(e) => handleKeyPress(e, () => handleUpdate(editingItem.id, editingItem.name, editingItem.hashtag || ''))}
                          onBlur={() => setEditingItem(null)}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-white"
                          placeholder="Hashtag..."
                        />
                      ) : (
                        <span className="text-slate-600 dark:text-slate-400 font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">#{item.hashtag || 'N/A'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => setEditingItem({ ...item, hashtag: item.hashtag || '' })}
                        aria-label={`Sửa ${currentType === 'property' ? 'loại hình BĐS' : 'loại hình giao dịch'}`}
                        title="Sửa"
                        className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        aria-label={`Xóa ${currentType === 'property' ? 'loại hình BĐS' : 'loại hình giao dịch'}`}
                        title="Xóa"
                        className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-1 ml-1 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" 
                      >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-md shadow-lg flex items-center gap-2 transform transition-transform duration-300 translate-y-0 text-sm font-medium z-50 ${
          toast.type === 'success'
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800'
            : 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800'
        }`}>
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {toast.message}
        </div>
      )}
    </div>
  );
}