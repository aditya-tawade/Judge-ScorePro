import clientPromise from '@/lib/mongodb';
import { pusherServer } from '@/lib/pusher';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const status = searchParams.get('status');

    try {
        const client = await clientPromise;
        const db = client.db();
        const query = {};
        if (eventId) query.eventId = eventId;
        if (status) query.status = status;

        const participants = await db.collection('participants').find(query).toArray();
        return NextResponse.json(participants);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { name, eventId, participantNumber, ageGroup } = await request.json();
        if (!name || !name.trim()) {
            return NextResponse.json({ error: 'Participant name is required' }, { status: 400 });
        }
        if (!eventId) {
            return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        const participant = {
            name,
            eventId,
            participantNumber,
            ageGroup,
            status: 'pending',
            createdAt: new Date(),
        };

        const result = await db.collection('participants').insertOne(participant);
        return NextResponse.json({ ...participant, _id: result.insertedId });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const { id, status } = await request.json();
        const client = await clientPromise;
        const db = client.db();

        const result = await db.collection('participants').findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { status } },
            { returnDocument: 'after' }
        );

        const updatedParticipant = result;

        if (status === 'active') {
            // Trigger Pusher event for judges
            await pusherServer.trigger('competition', 'participant-active', {
                participant: updatedParticipant
            });
        }

        return NextResponse.json(updatedParticipant);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });

        const client = await clientPromise;
        const db = client.db();

        // Cascading delete: Remove all scores for this participant first
        await db.collection('scores').deleteMany({ participantId: new ObjectId(id) });

        // Remove the participant
        await db.collection('participants').deleteOne({ _id: new ObjectId(id) });

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
