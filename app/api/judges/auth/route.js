import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { passcode } = await request.json();
        if (!passcode) return NextResponse.json({ error: 'Passcode is required' }, { status: 400 });

        const client = await clientPromise;
        const db = client.db();

        const judge = await db.collection('judges').findOne({
            passcode: passcode.toUpperCase()
        });

        if (!judge) {
            return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
        }

        return NextResponse.json({
            success: true,
            judge: {
                id: judge._id,
                name: judge.name
            }
        });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
