import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db();
        const judges = await db.collection('judges').find({}).toArray();
        return NextResponse.json(judges);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { name, phone } = await request.json();
        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        const client = await clientPromise;
        const db = client.db();

        // Generate an 8-character unique passcode
        const passcode = nanoid(8).toUpperCase();

        const newJudge = {
            name,
            phone: phone || '',
            passcode,
            createdAt: new Date()
        };

        const result = await db.collection('judges').insertOne(newJudge);
        return NextResponse.json({ ...newJudge, _id: result.insertedId });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        const client = await clientPromise;
        const db = client.db();
        await db.collection('judges').deleteOne({ _id: new ObjectId(id) });

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
