export const createPeer = ({ socket, from, to, onRemoteStream }) => {
    const peer = new RTCPeerConnection({
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            {
                urls: "turn:openrelay.metered.ca:443",
                username: "openrelayproject",
                credential: "openrelayproject",
            },
        ],
    });

    peer.onicecandidate = (e) => {
        if (e.candidate) {
            socket.emit("webrtc:ice-candidate", {
                from,
                to,
                candidate: e.candidate,
            });
        }
    };

    peer.ontrack = (event) => {
        const [stream] = event.streams;
        if (stream && onRemoteStream) {
            onRemoteStream(stream);
        }
    };

    return peer;
};
