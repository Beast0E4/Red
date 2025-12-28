import { useEffect, useRef, useState } from "react";
import { createPeer } from "../webrtc/peer";
import { getMediaStream } from "../webrtc/media";
import { useSelector } from "react-redux";

export const useCall = () => {
    const authState = useSelector((state) => state.auth);
    const socket = useSelector((state) => state.socket.socket);

    const [remoteStream, setRemoteStream] = useState(null);

    const peerRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    
    // Store ICE candidates until remote description is set
    const pendingIceCandidates = useRef([]);

    const [call, setCall] = useState({
        inCall: false,
        incoming: false,
        outgoing: false,
        from: null, // { _id, username }
        to: null,   // { _id, username }
        type: null,
    });

    /* ================= START CALL ================= */
    const startCall = (receiver, type) => {
        // Optimistically set outgoing state
        setCall({ 
            outgoing: true, 
            inCall: false,
            to: receiver, // Store full object for UI
            type 
        });

        socket.emit("call:start", {
            callerId: authState.data._id,
            receiverId: receiver._id,
            callType: type,
        });
    };

    /* ================= ACCEPT CALL ================= */
    const acceptCall = () => {
        // Ensure we have a valid caller ID
        if (!call.from) return;

        setCall((prev) => ({
            ...prev,
            inCall: true,
            incoming: false,
        }));

        socket.emit("call:accept", {
            callerId: call.from._id,
            receiverId: authState.data._id,
        });
    };

    /* ================= END CALL ================= */
    const endCall = () => {
        const otherUserId = call.from?._id || call.to?._id;

        if (otherUserId) {
            socket.emit("call:end", {
                callerId: authState.data._id,
                receiverId: otherUserId,
            });
        }

        // Cleanup Media & Peer
        cleanupCall();
    };

    const cleanupCall = () => {
        // Stop Local Tracks
        if (localVideoRef.current?.srcObject) {
            localVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
            localVideoRef.current.srcObject = null;
        }

        // Close Peer
        if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
        }

        // Reset State
        setRemoteStream(null);
        pendingIceCandidates.current = [];
        setCall({
            inCall: false,
            incoming: false,
            outgoing: false,
            from: null,
            to: null,
            type: null,
        });
    };

    /* ================= SOCKET EVENT LISTENERS ================= */
    useEffect(() => {
        if (!socket) return;

        const handleIncomingCall = ({ from, type }) => {
            setCall({ incoming: true, from, type, inCall: false });
        };

        const handleCallAccepted = async ({ by }) => {
            // 'by' is the receiver user object
            setCall((prev) => ({ ...prev, inCall: true }));

            // 1. Create Peer (pass ID string, NOT object)
            const peer = createPeer({
                socket,
                from: authState.data._id,
                to: by._id, // <--- FIX: Access ._id
                onRemoteStream: setRemoteStream,
            });
            peerRef.current = peer;

            // 2. Get Local Stream
            const stream = await getMediaStream(call.type);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            stream.getTracks().forEach((track) => peer.addTrack(track, stream));

            // 3. Create Offer
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            socket.emit("webrtc:offer", {
                from: authState.data._id,
                to: by._id, // <--- FIX: Access ._id
                offer,
            });
        };

        const handleWebRTCOffer = async ({ from, offer }) => {
            // 1. Create Peer
            const peer = createPeer({
                socket,
                from: authState.data._id,
                to: from, // 'from' here is usually an ID string from the server event
                onRemoteStream: setRemoteStream,
            });
            peerRef.current = peer;

            // 2. Get Local Stream
            const stream = await getMediaStream(call.type);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            stream.getTracks().forEach((track) => peer.addTrack(track, stream));

            // 3. Set Remote Desc & Add Candidates
            await peer.setRemoteDescription(offer);
            pendingIceCandidates.current.forEach((c) => {
                peer.addIceCandidate(new RTCIceCandidate(c));
            });
            pendingIceCandidates.current = [];

            // 4. Answer
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            socket.emit("webrtc:answer", {
                from: authState.data._id,
                to: from, 
                answer,
            });
        };

        const handleWebRTCAnswer = async ({ answer }) => {
            if (peerRef.current) {
                await peerRef.current.setRemoteDescription(answer);
                // Process any candidates waiting for remote desc
                pendingIceCandidates.current.forEach((c) => {
                    peerRef.current.addIceCandidate(new RTCIceCandidate(c));
                });
                pendingIceCandidates.current = [];
            }
        };

        const handleIceCandidate = ({ candidate }) => {
            const peer = peerRef.current;
            if (peer) {
                if (peer.remoteDescription) {
                    peer.addIceCandidate(new RTCIceCandidate(candidate));
                } else {
                    pendingIceCandidates.current.push(candidate);
                }
            }
        };

        const handleCallEnd = () => {
            cleanupCall();
        };

        // --- Attach Listeners ---
        socket.on("call:incoming", handleIncomingCall);
        socket.on("call:accepted", handleCallAccepted);
        socket.on("webrtc:offer", handleWebRTCOffer);
        socket.on("webrtc:answer", handleWebRTCAnswer);
        socket.on("webrtc:ice-candidate", handleIceCandidate);
        socket.on("call:end", handleCallEnd);

        // --- Cleanup Listeners (Safe Way) ---
        return () => {
            socket.off("call:incoming", handleIncomingCall);
            socket.off("call:accepted", handleCallAccepted);
            socket.off("webrtc:offer", handleWebRTCOffer);
            socket.off("webrtc:answer", handleWebRTCAnswer);
            socket.off("webrtc:ice-candidate", handleIceCandidate);
            socket.off("call:end", handleCallEnd);
        };
    }, [socket, call.type]); // Removed unnecessary dependencies

    /* ================= STREAM ASSIGNMENT ================= */
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    /* ================= PREVENT ACCIDENTAL RELOAD ================= */
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (call.inCall || call.incoming || call.outgoing) {
                e.preventDefault();
                e.returnValue = "";
                return "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [call.inCall, call.incoming, call.outgoing]);

    return {
        call,
        startCall,
        acceptCall,
        endCall,
        localVideoRef,
        remoteVideoRef,
    };
};