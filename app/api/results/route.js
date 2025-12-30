import clientPromise from '@/lib/mongodb';
import { pusherServer } from '@/lib/pusher';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function POST(request) {
    try {
        const { participantId, eventId } = await request.json();
        const client = await clientPromise;
        const db = client.db();

        // Get all scores for this participant
        const scores = await db.collection('scores').find({
            participantId: new ObjectId(participantId)
        }).toArray();

        if (scores.length === 0) {
            return NextResponse.json({ error: 'No scores found' }, { status: 400 });
        }

        const averageScore = scores.reduce((acc, s) => acc + s.totalScore, 0) / scores.length;

        // Update participant status to completed and save final score
        await db.collection('participants').updateOne(
            { _id: new ObjectId(participantId) },
            {
                $set: {
                    status: 'completed',
                    averageScore: parseFloat(averageScore.toFixed(2))
                }
            }
        );

        // Get all completed participants for this event to calculate ranks
        const allCompleted = await db.collection('participants')
            .find({ eventId, status: 'completed' })
            .sort({ averageScore: -1 })
            .toArray();

        // Trigger leaderboard update
        await pusherServer.trigger('competition', 'leaderboard-update', {
            eventId,
            leaderboard: allCompleted
        });

        return NextResponse.json({ success: true, averageScore });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    try {
        const client = await clientPromise;
        const db = client.db();
        const leaderboard = await db.collection('participants')
            .find({ eventId, status: 'completed' })
            .sort({ averageScore: -1 })
            .toArray();

        return NextResponse.json(leaderboard);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
