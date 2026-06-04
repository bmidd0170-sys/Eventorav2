import { fetchWithAuth } from "@/lib/api-client"
import { getFriendlyResponseMessage } from "@/lib/error-utils"

export interface Connection {
    id: string;
    userId: string;
    connectedUserId: string;
    connectedUserName: string;
    connectedUserEmail: string;
    status: 'pending' | 'accepted' | 'blocked';
    createdAt: string | Date;
    updatedAt: string | Date;
}

export interface ConnectionRequest {
    id: string;
    fromUserId: string;
    toUserId: string;
    fromUserName: string;
    fromUserEmail: string;
    toUserName?: string | null;
    toUserEmail?: string | null;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string | Date;
    updatedAt: string | Date;
}

/**
 * Get all accepted connections for a user
 */
export async function getConnections(userId: string): Promise<Connection[]> {
    try {
        const response = await fetchWithAuth('/api/connections?view=connections');
        if (!response.ok) {
            throw new Error(await getFriendlyResponseMessage(response, 'We could not load your connections right now.'));
        }

        const data = (await response.json()) as { connections: Connection[] };
        return data.connections;
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
        const response = await fetchWithAuth('/api/connections?view=requests');
        if (!response.ok) {
            throw new Error(await getFriendlyResponseMessage(response, 'We could not load pending requests right now.'));
        }

        const data = (await response.json()) as { requests: ConnectionRequest[] };
        return data.requests;
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        throw error;
    }
}

/**
 * Get pending outgoing connection requests for a user
 */
export async function getOutgoingRequests(userId: string): Promise<ConnectionRequest[]> {
    try {
        const response = await fetchWithAuth('/api/connections?view=outgoing-requests');
        if (!response.ok) {
            throw new Error(await getFriendlyResponseMessage(response, 'We could not load outgoing requests right now.'));
        }

        const data = (await response.json()) as { requests: ConnectionRequest[] };
        return data.requests;
    } catch (error) {
        console.error('Error fetching outgoing requests:', error);
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
        const response = await fetchWithAuth('/api/connections', {
            method: 'POST',
            body: JSON.stringify({
                action: 'send',
                recipientEmail: toUserEmail,
            }),
        });

        if (!response.ok) {
            throw new Error(await getFriendlyResponseMessage(response, 'We could not send the connection request right now.'));
        }

        const data = (await response.json()) as { request: ConnectionRequest };
        return data.request.id;
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
        const response = await fetchWithAuth('/api/connections', {
            method: 'POST',
            body: JSON.stringify({ action: 'accept', requestId }),
        });

        if (!response.ok) {
            throw new Error(await getFriendlyResponseMessage(response, 'We could not accept that connection request right now.'));
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
        const response = await fetchWithAuth('/api/connections', {
            method: 'POST',
            body: JSON.stringify({ action: 'reject', requestId }),
        });

        if (!response.ok) {
            throw new Error(await getFriendlyResponseMessage(response, 'We could not reject that connection request right now.'));
        }
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
        const response = await fetchWithAuth('/api/connections', {
            method: 'DELETE',
            body: JSON.stringify({ connectedUserId }),
        });

        if (!response.ok) {
            throw new Error(await getFriendlyResponseMessage(response, 'We could not remove that connection right now.'));
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
        const response = await fetchWithAuth('/api/connections', {
            method: 'POST',
            body: JSON.stringify({
                action: 'block',
                connectedUserId: blockedUserId,
                connectedUserName: blockedUserName,
                connectedUserEmail: blockedUserEmail,
            }),
        });

        if (!response.ok) {
            throw new Error(await getFriendlyResponseMessage(response, 'We could not block that user right now.'));
        }
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
        const response = await fetchWithAuth('/api/connections', {
            method: 'POST',
            body: JSON.stringify({
                action: 'unblock',
                connectedUserId: blockedUserId,
            }),
        });

        if (!response.ok) {
            throw new Error(await getFriendlyResponseMessage(response, 'We could not unblock that user right now.'));
        }
    } catch (error) {
        console.error('Error unblocking user:', error);
        throw error;
    }
}
