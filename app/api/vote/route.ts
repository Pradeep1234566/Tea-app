import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { roomId, userId, target } = await req.json()

    if (!roomId || !userId || !target) {
      return Response.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Prevent double-voting: one vote per user per room
    const existing = await (prisma as any).vote.findFirst({
      where: { roomId, userId }
    })
    if (existing) {
      return Response.json({ error: 'Already voted' }, { status: 409 })
    }

    await (prisma as any).vote.create({
      data: { roomId, userId, target }
    })

    return Response.json({ success: true })
  } catch (err) {
    console.error('[vote]', err)
    return Response.json({ error: 'Vote failed' }, { status: 500 })
  }
}