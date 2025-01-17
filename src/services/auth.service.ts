import admin from "firebase-admin";
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';

const serviceAccount = Bun.file(process.env.FIREBASE_ADMINSDK_PATH!);

admin.initializeApp({
  credential: admin.credential.cert(await serviceAccount.json()),
});

export async function verifyToken(token: string): Promise<DecodedIdToken> {
  const decodedToken = await getAuth().verifyIdToken(token);
  return decodedToken;
}