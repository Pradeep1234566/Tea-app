import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { roomId } = await req.json()

    if (!roomId) {
      return Response.json({ error: 'Missing roomId' }, { status: 400 })
    }

    const users = await prisma.user.findMany({
      where: { roomId },
      
    })

    return Response.json(users)
  } catch (err) {
    console.error('[users]', err)
    return Response.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}