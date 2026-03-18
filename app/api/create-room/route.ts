export const dynamic = "force-dynamic";
export const runtime = "nodejs";



import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const room = await prisma.room.create({ data: {} })
    return Response.json({ roomId: room.id })
  } catch (err) {
    console.error('[create-room]', err)
    return Response.json({ error: 'Failed to create room' }, { status: 500 })
  }
}