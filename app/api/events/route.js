import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db();
        const events = await db.collection('events').find({}).toArray();
        return NextResponse.json(events);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { name, criteria } = await request.json();
        const client = await clientPromise;
        const db = client.db();
        const result = await db.collection('events').insertOne({
            name,
            criteria,
            createdAt: new Date(),
        });
        return NextResponse.json(result);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
