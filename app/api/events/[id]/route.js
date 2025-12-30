import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const client = await clientPromise;
        const db = client.db();

        // 1. Delete all scores associated with the event
        await db.collection('scores').deleteMany({ eventId: id });

        // 2. Delete all participants associated with the event
        await db.collection('participants').deleteMany({ eventId: new ObjectId(id) });

        // 3. Delete the event itself
        const result = await db.collection('events').deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
