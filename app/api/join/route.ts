import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { name, roomId } = await req.json()

    if (!name?.trim() || !roomId) {
      return Response.json({ error: 'Missing name or roomId' }, { status: 400 })
    }

    // Check room exists
    const room = await prisma.room.findUnique({ where: { id: roomId } })
    if (!room) {
      return Response.json({ error: 'Room not found' }, { status: 404 })
    }

    const user = await prisma.user.create({
      data: { name: name.trim(), roomId }
    })

    return Response.json({ userId: user.id })
  } catch (err) {
    console.error('[join]', err)
    return Response.json({ error: 'Join failed' }, { status: 500 })
  }
}