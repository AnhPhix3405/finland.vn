// Test script to create sample projects
// Run this in the browser console or as a script to add sample data

const sampleProjects = [
  {
    name: "Vinhomes Ocean Park 3",
    slug: "vinhomes-ocean-park-3",
    project_code: "VOP3",
    developer: "Vingroup",
    contact_name: "Nguyễn Văn An",
    contact_phone: "0987654321",
    content: "Vinhomes Ocean Park 3 – The Crown là hợp phần cuối cùng của siêu quần thể đô thị biển 1.200ha của Vinhomes tại phía Đông Hà Nội. Kế thừa những tinh hoa của 2 giai đoạn trước, Vinhomes Ocean Park 3 được định vị là 'Vịnh biển bốn mùa - Tiên phong dẫn sóng', mang đến trải nghiệm sống thượng lưu đỉnh cao.\\n\\nTọa lạc tại vị trí đắc địa, dự án sở hữu kết nối giao thông hoàn hảo khi nằm kề cận các tuyến đường huyết mạch như Quốc lộ 5A, 5B, đường vành đai 3.5.",
    status: "đang mở bán",
    area_min: 85,
    area_max: 120,
    price: 3500000000,
    project_type: "Căn hộ, Biệt thự",
    province: "Hưng Yên",
    ward: "Văn Giang"
  },
  {
    name: "Aqua City Biên Hòa",
    slug: "aqua-city-bien-hoa",
    project_code: "ACB",
    developer: "Novaland",
    contact_name: "Trần Thị Minh",
    contact_phone: "0912345678",
    content: "Aqua City là khu đô thị sinh thái thông minh quy mô 1.000ha tại Biên Hòa, Đồng Nai. Dự án được quy hoạch theo mô hình thành phố trong công viên với 60% diện tích dành cho không gian xanh và mặt nước.\\n\\nAqua City sở hữu vị trí đắc địa kết nối thuận tiện với TP.HCM chỉ 30 phút di chuyển qua các tuyến giao thông huyết mạch.",
    status: "sắp mở bán",
    area_min: 100,
    area_max: 150,
    price: 2800000000,
    project_type: "Nhà phố, Biệt thự",
    province: "Đồng Nai",
    ward: "Biên Hòa"
  },
  {
    name: "Masteri Centre Point",
    slug: "masteri-centre-point",
    project_code: "MCP",
    developer: "Masterise Homes",
    contact_name: "Lê Hoàng Long",
    contact_phone: "0988777999",
    content: "Masteri Centre Point là tổ hợp căn hộ cao cấp tại trung tâm Quận 9 với thiết kế hiện đại và tiện ích đầy đủ. Dự án gồm 2 tòa tháp cao 40 tầng với tổng cộng 1.200 căn hộ.\\n\\nVị trí dự án thuận lợi kết nối với Metro số 1 và các tuyến giao thông quan trọng của thành phố.",
    status: "đã bàn giao",
    area_min: 50,
    area_max: 90,
    price: 4200000000,
    project_type: "Căn hộ",
    province: "TP. Hồ Chí Minh",
    ward: "Quận 9"
  }
];

// Function to create projects
async function createSampleProjects() {
  for (const project of sampleProjects) {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Created project: ${project.name}`);
      } else {
        console.log(`❌ Failed to create project: ${project.name} - ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ Error creating project ${project.name}:`, error);
    }
  }
  console.log('🎉 Sample project creation completed!');
}

// To run this script:
// 1. Open your browser developer tools (F12)
// 2. Go to the Console tab
// 3. Copy and paste this entire script
// 4. Run: createSampleProjects()

console.log('📝 Sample project creation script loaded. Run createSampleProjects() to create sample data.');

// Export for Node.js usage if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sampleProjects, createSampleProjects };
}