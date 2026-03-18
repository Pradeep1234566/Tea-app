import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { roomId } = await req.json()

    if (!roomId) {
      return Response.json({ error: 'Missing roomId' }, { status: 400 })
    }

    const votes = await (prisma as any).vote.findMany({ where: { roomId } })

    const result: Record<string, number> = {}
    votes.forEach((v: any) => {
      if (!v.target) return
      result[v.target] = (result[v.target] || 0) + 1
    })

    return Response.json(result)
  } catch (err) {
    console.error('[results]', err)
    return Response.json({ error: 'Failed to fetch results' }, { status: 500 })
  }
}