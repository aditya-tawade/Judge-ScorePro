import clientPromise from '@/lib/mongodb';
import { pusherServer } from '@/lib/pusher';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function POST(request) {
    try {
        const { participantId, judgeId, judgeName, scores, totalScore, eventId } = await request.json();
        const client = await clientPromise;
        const db = client.db();

        // Check if already submitted
        const existing = await db.collection('scores').findOne({
            participantId: new ObjectId(participantId),
            judgeId
        });

        if (existing) {
            return NextResponse.json({ error: 'Score already submitted' }, { status: 400 });
        }

        const scoreData = {
            participantId: new ObjectId(participantId),
            judgeId,
            judgeName,
            scores,
            totalScore,
            eventId,
            submittedAt: new Date()
        };

        const result = await db.collection('scores').insertOne(scoreData);

        // Notify admin
        await pusherServer.trigger('competition', 'score-submitted', {
            participantId,
            judgeId,
            judgeName,
            totalScore
        });

        return NextResponse.json({ ...scoreData, _id: result.insertedId });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participantId');

    try {
        const client = await clientPromise;
        const db = client.db();
        const scores = await db.collection('scores').find({
            participantId: new ObjectId(participantId)
        }).toArray();
        return NextResponse.json(scores);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
