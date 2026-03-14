'use client';
import React, { useState, useEffect } from 'react';

export const provinces = [
    "Tuyên Quang", "Lào Cai", "Thái Nguyên", "Phú Thọ", "Bắc Ninh", "Hưng Yên", "Hải Phòng", "Ninh Bình",
    "Quảng Trị", "Đà Nẵng", "Quảng Ngãi", "Gia Lai", "Khánh Hoà", "Lâm Đồng", "Đắk Lắk", "Hồ Chí Minh",
    "Đồng Nai", "Tây Ninh", "Cần Thơ", "Vĩnh Long", "Đồng Tháp", "Cà Mau", "An Giang", "Hà Nội", "Huế",
    "Lai Châu", "Điện Biên", "Sơn La", "Lạng Sơn", "Quảng Ninh", "Thanh Hoá", "Nghệ An", "Hà Tĩnh", "Cao Bằng"
];

interface LocationSelectorProps {
    selectedProvince: string;
    onProvinceChange: (value: string) => void;
    selectedWard: string;
    onWardChange: (value: string) => void;
}

export default function LocationSelector({
    selectedProvince,
    onProvinceChange,
    selectedWard,
    onWardChange
}: LocationSelectorProps) {
    const [wardsList, setWardsList] = useState<{ name: string }[]>([]);

    useEffect(() => {
        if (!selectedProvince) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setWardsList([]);
            return;
        }
        const fetchWards = async () => {
            try {
                const url = `https://vietnamlabs.com/api/vietnamprovince?province=${encodeURIComponent(selectedProvince)}`;
                const res = await fetch(url);
                const data = await res.json();
                if (data?.success && data?.data?.wards) {
                    setWardsList(data.data.wards);
                } else {
                    setWardsList([]);
                }
            } catch (err) {
                console.error('Error fetching wards:', err);
            }
        };
        fetchWards();
    }, [selectedProvince]);

    return (
        <>
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="projectCity">
                    Tỉnh / Thành phố <span className="text-red-500">*</span>
                </label>
                <select
                    value={selectedProvince}
                    onChange={(e) => {
                        onProvinceChange(e.target.value);
                        onWardChange('');
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 transition-all text-slate-900 dark:text-white"
                    id="projectCity"
                >
                    <option value="">Chọn Tỉnh / Thành phố</option>
                    {provinces.map((prov) => (
                        <option key={prov} value={prov}>{prov}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="projectDistrict">
                    Phường / Xã <span className="text-red-500">*</span>
                </label>
                <select
                    value={selectedWard}
                    onChange={(e) => onWardChange(e.target.value)}
                    disabled={!selectedProvince || wardsList.length === 0}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500 transition-all text-slate-900 dark:text-white disabled:opacity-50"
                    id="projectDistrict"
                >
                    <option value="">Chọn Phường / Xã</option>
                    {wardsList.map((ward, idx) => (
                        <option key={idx} value={ward.name}>{ward.name}</option>
                    ))}
                </select>
            </div>
        </>
    );
}
