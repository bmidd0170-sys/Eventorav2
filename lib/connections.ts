import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { getUserNotificationSettings, sendEmailIfAllowed } from './notifications'

export interface Connection {
    id: string;
    userId: string;
    connectedUserId: string;
    connectedUserName: string;
    connectedUserEmail: string;
    status: 'pending' | 'accepted' | 'blocked';
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

export interface ConnectionRequest {
    id: string;
    fromUserId: string;
    toUserId: string;
    fromUserName: string;
    fromUserEmail: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

/**
 * Get all accepted connections for a user
 */
export async function getConnections(userId: string): Promise<Connection[]> {
    try {
        const q = query(
            collection(db, 'connections'),
            where('userId', '==', userId),
            where('status', '==', 'accepted')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        } as Connection));
    } catch (error) {
        console.error('Error fetching connections:', error);
        throw error;
    }
}

/**
 * Get pending connection requests for a user
 */
export async function getPendingRequests(userId: string): Promise<ConnectionRequest[]> {
    try {
        const q = query(
            collection(db, 'connectionRequests'),
            where('toUserId', '==', userId),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        } as ConnectionRequest));
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        throw error;
    }
}

/**
 * Send a connection request to another user
 */
export async function sendConnectionRequest(
    fromUserId: string,
    toUserId: string,
    fromUserName: string,
    fromUserEmail: string,
    toUserEmail: string
): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, 'connectionRequests'), {
            fromUserId,
            toUserId,
            fromUserName,
            fromUserEmail,
            toUserEmail,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        // Notify recipient by email only if they have enabled connection request emails
        try {
            await sendEmailIfAllowed(toUserId, 'emailConnectionsRequests', {
                to: toUserEmail,
                subject: `${fromUserName} sent you a connection request on Eventora`,
                text: `${fromUserName} (${fromUserEmail}) wants to connect with you on Eventora.`,
                html: `<p><strong>${fromUserName}</strong> (${fromUserEmail}) wants to connect with you on <strong>Eventora</strong>.</p>`,
            })
        } catch (e) {
            console.warn('Failed to send connection request email', e)
        }
        return docRef.id;
    } catch (error) {
        console.error('Error sending connection request:', error);
        throw error;
    }
}

/**
 * Accept a connection request
 */
export async function acceptConnectionRequest(
    requestId: string,
    fromUserId: string,
    toUserId: string,
    fromUserName: string,
    toUserName: string,
    fromUserEmail: string,
    toUserEmail: string
): Promise<void> {
    try {
        // Update the request status
        await updateDoc(doc(db, 'connectionRequests', requestId), {
            status: 'accepted',
            updatedAt: serverTimestamp(),
        });

        // Create connection record for both users
        await addDoc(collection(db, 'connections'), {
            userId: toUserId,
            connectedUserId: fromUserId,
            connectedUserName: fromUserName,
            connectedUserEmail: fromUserEmail,
            status: 'accepted',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        await addDoc(collection(db, 'connections'), {
            userId: fromUserId,
            connectedUserId: toUserId,
            connectedUserName: toUserName,
            connectedUserEmail: toUserEmail,
            status: 'accepted',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        // Notify both users by email only if they have enabled acceptance emails
        try {
            await Promise.all([
                sendEmailIfAllowed(toUserId, 'emailConnectionsAccepted', {
                    to: toUserEmail,
                    subject: `You accepted ${fromUserName}'s connection request`,
                    text: `You accepted ${fromUserName}'s connection request on Eventora.`,
                    html: `<p>You accepted <strong>${fromUserName}</strong>'s connection request on <strong>Eventora</strong>.</p>`,
                }),
                sendEmailIfAllowed(fromUserId, 'emailConnectionsAccepted', {
                    to: fromUserEmail,
                    subject: `${toUserName} accepted your connection request`,
                    text: `${toUserName} accepted your connection request on Eventora.`,
                    html: `<p><strong>${toUserName}</strong> accepted your connection request on <strong>Eventora</strong>.</p>`,
                }),
            ])
        } catch (e) {
            console.warn('Failed to send connection accepted emails', e)
        }
    } catch (error) {
        console.error('Error accepting connection request:', error);
        throw error;
    }
}

/**
 * Reject a connection request
 */
export async function rejectConnectionRequest(requestId: string): Promise<void> {
    try {
        await updateDoc(doc(db, 'connectionRequests', requestId), {
            status: 'rejected',
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error rejecting connection request:', error);
        throw error;
    }
}

/**
 * Remove a connection
 */
export async function removeConnection(
    userId: string,
    connectedUserId: string
): Promise<void> {
    try {
        const q = query(
            collection(db, 'connections'),
            where('userId', '==', userId),
            where('connectedUserId', '==', connectedUserId)
        );
        const snapshot = await getDocs(q);

        for (const doc of snapshot.docs) {
            await deleteDoc(doc.ref);
        }
    } catch (error) {
        console.error('Error removing connection:', error);
        throw error;
    }
}

/**
 * Block a user
 */
export async function blockUser(
    userId: string,
    blockedUserId: string,
    blockedUserName: string,
    blockedUserEmail: string
): Promise<void> {
    try {
        // Remove existing connection if any
        await removeConnection(userId, blockedUserId);

        // Add to blocked list
        await addDoc(collection(db, 'connections'), {
            userId,
            connectedUserId: blockedUserId,
            connectedUserName: blockedUserName,
            connectedUserEmail: blockedUserEmail,
            status: 'blocked',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error blocking user:', error);
        throw error;
    }
}

/**
 * Unblock a user
 */
export async function unblockUser(userId: string, blockedUserId: string): Promise<void> {
    try {
        const q = query(
            collection(db, 'connections'),
            where('userId', '==', userId),
            where('connectedUserId', '==', blockedUserId),
            where('status', '==', 'blocked')
        );
        const snapshot = await getDocs(q);

        for (const doc of snapshot.docs) {
            await deleteDoc(doc.ref);
        }
    } catch (error) {
        console.error('Error unblocking user:', error);
        throw error;
    }
}
