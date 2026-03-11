import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../lib/auth';
import { uploadImage } from '../../../lib/cloudinary';

export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { image, folder } = await request.json();
    if (!image) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

    const result = await uploadImage(image, `digiboi/${folder || 'misc'}`);
    if (!result) return NextResponse.json({ error: 'Upload failed' }, { status: 500 });

    return NextResponse.json({ url: result.url, publicId: result.publicId });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
