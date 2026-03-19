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
    showLabels?: boolean;
    requiredProvince?: boolean;
    requiredWard?: boolean;
    className?: string;
}

const danhSachDonViHanhChinhKhanhHoa: string[] = [
    // Danh sách các xã mới sau sắp xếp
    "Xã Nam Cam Ranh",
    "Xã Bắc Ninh Hòa",
    "Xã Tân Định",
    "Xã Nam Ninh Hòa",
    "Xã Tây Ninh Hòa",
    "Xã Hòa Trí",
    "Xã Đại Lãnh",
    "Xã Tu Bông",
    "Xã Vạn Thắng",
    "Xã Vạn Ninh",
    "Xã Vạn Hưng",
    "Xã Diên Khánh",
    "Xã Diên Lạc",
    "Xã Diên Điền",
    "Xã Diên Lâm",
    "Xã Diên Thọ",
    "Xã Suối Hiệp",
    "Xã Cam Lâm",
    "Xã Suối Dầu",
    "Xã Cam Hiệp",
    "Xã Cam An",
    "Xã Bắc Khánh Vĩnh",
    "Xã Trung Khánh Vĩnh",
    "Xã Tây Khánh Vĩnh",
    "Xã Nam Khánh Vĩnh",
    "Xã Khánh Vĩnh",
    "Xã Khánh Sơn",
    "Xã Tây Khánh Sơn",
    "Xã Đông Khánh Sơn",

    // Danh sách các phường mới sau sắp xếp
    "Phường Nha Trang",
    "Phường Bắc Nha Trang",
    "Phường Tây Nha Trang",
    "Phường Nam Nha Trang",
    "Phường Bắc Cam Ranh",
    "Phường Cam Ranh",
    "Phường Cam Linh",
    "Phường Ba Ngòi",
    "Phường Ninh Hòa",
    "Phường Đông Ninh Hòa",
    "Phường Hòa Thắng",

    // Đặc khu hành chính
    "Đặc khu Trường Sa"
];

export default function LocationSelector({
    selectedProvince,
    onProvinceChange,
    selectedWard,
    onWardChange,
    showLabels = true,
    requiredProvince = false,
    requiredWard = false,
    className = ''
}: LocationSelectorProps) {
    const [wardsList, setWardsList] = useState<{ name: string }[]>([]);

    useEffect(() => {
        if (!selectedProvince) {
            setWardsList([]);
            return;
        }

        if (selectedProvince === "Khánh Hoà") {
            setWardsList(danhSachDonViHanhChinhKhanhHoa.map(name => ({ name })));
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
        <div className={`grid grid-cols-2 ${showLabels ? 'gap-4' : 'gap-3'} ${className}`}>
            <div className={showLabels ? "space-y-2" : ""}>
                {showLabels && (
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="projectCity">
                        Tỉnh / Thành phố {requiredProvince && <span className="text-red-500">*</span>}
                    </label>
                )}
                <select
                    value={selectedProvince}
                    onChange={(e) => {
                        onProvinceChange(e.target.value);
                        onWardChange('');
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-1 focus:ring-orange-500 transition-all text-sm appearance-none cursor-pointer dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:ring-orange-500"
                    id="projectCity"
                    name="province"
                >
                    <option value="" className="bg-slate-900">Chọn Tỉnh / Thành phố</option>
                    {provinces.map((prov) => (
                        <option key={prov} value={prov} className="bg-slate-900">{prov}</option>
                    ))}
                </select>
            </div>

            <div className={showLabels ? "space-y-2" : ""}>
                {showLabels && (
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="projectDistrict">
                        Phường / Xã {requiredWard && <span className="text-red-500">*</span>}
                    </label>
                )}
                <select
                    value={selectedWard}
                    onChange={(e) => onWardChange(e.target.value)}
                    disabled={!selectedProvince || wardsList.length === 0}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-1 focus:ring-orange-500 transition-all text-sm appearance-none cursor-pointer disabled:opacity-50 dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:ring-orange-500 dark:disabled:opacity-50"
                    id="projectDistrict"
                >
                    <option value="" className="bg-slate-900">Chọn Phường / Xã</option>
                    {wardsList.map((ward, idx) => (
                        <option key={idx} value={ward.name} className="bg-slate-900">{ward.name}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
