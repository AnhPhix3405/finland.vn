import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { verifyToken } from '@/src/app/modules/auth/jwt';

async function verifyAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return { valid: false, error: 'Token không tồn tại' };
  }

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return { valid: false, error: 'Token không hợp lệ hoặc không phải admin' };
  }

  return { valid: true, payload };
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifyAdminAuth(request);
    if (!authCheck.valid) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: 401 }
      );
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalProjects,
      totalListings,
      totalBrokers,
      activeBrokers,
      projectsLastMonth,
      listingsLastMonth,
      brokersLastMonth,
    ] = await Promise.all([
      prisma.projects.count(),
      prisma.listings.count(),
      prisma.brokers.count(),
      prisma.brokers.count({ where: { is_active: true } }),
      prisma.projects.count({ where: { created_at: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.listings.count({ where: { created_at: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.brokers.count({ where: { created_at: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    ]);

    const projectsThisMonth = await prisma.projects.count({ where: { created_at: { gte: startOfMonth } } });
    const listingsThisMonth = await prisma.listings.count({ where: { created_at: { gte: startOfMonth } } });
    const brokersThisMonth = await prisma.brokers.count({ where: { created_at: { gte: startOfMonth } } });

    const projectsTrend = projectsLastMonth > 0 
      ? Math.round(((projectsThisMonth - projectsLastMonth) / projectsLastMonth) * 100)
      : projectsThisMonth > 0 ? 100 : 0;
    
    const listingsTrend = listingsLastMonth > 0 
      ? Math.round(((listingsThisMonth - listingsLastMonth) / listingsLastMonth) * 100)
      : listingsThisMonth > 0 ? 100 : 0;
    
    const brokersTrend = brokersLastMonth > 0 
      ? Math.round(((brokersThisMonth - brokersLastMonth) / brokersLastMonth) * 100)
      : brokersThisMonth > 0 ? 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalProjects,
        totalListings,
        totalBrokers,
        activeBrokers,
        trends: {
          projects: projectsTrend,
          listings: listingsTrend,
          brokers: brokersTrend,
        }
      }
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải thống kê' },
      { status: 500 }
    );
  }
}
