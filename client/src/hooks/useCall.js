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

    const pendingIceCandidates = useRef([]);

    const [call, setCall] = useState({
        inCall: false,
        incoming: false,
        outgoing: false,
        from: null,
        type: null,
    });

    /* ---------- START CALL (CALLER) ---------- */
    const startCall = (receiverId, type) => {
        setCall({ outgoing: true, to: receiverId, type });

        socket.emit("call:start", {
            callerId: authState.data._id,
            receiverId,
            callType: type,
        });
    };

    /* ---------- ACCEPT CALL (RECEIVER) ---------- */
    const acceptCall = () => {
        setCall((c) => ({
            ...c,
            inCall: true,
            incoming: false,
        }));

        socket.emit("call:accept", {
            callerId: call.from._id,
            receiverId: authState.data._id,
        });
    };


    /* ---------- SOCKET LISTENERS ---------- */
    useEffect(() => {
        if (!socket) return;

        /* INCOMING CALL */
        socket.on("call:incoming", ({ from, type }) => {
            setCall({
                incoming: true,
                from,
                type,
            });
        });

        /* CALL ACCEPTED → CALLER CREATES OFFER */
        socket.on("call:accepted", async ({ by }) => {
            if (peerRef.current) return;

            setCall((c) => ({ ...c, inCall: true }));

            const peer = createPeer({
                socket,
                from: authState.data._id,
                to: by,
                onRemoteStream: setRemoteStream,
            });

            peerRef.current = peer;

            const stream = await getMediaStream(call.type);

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            stream.getTracks().forEach(track =>
                peer.addTrack(track, stream)
            );

            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            socket.emit("webrtc:offer", {
                from: authState.data._id,
                to: by,
                offer,
            });
        });


        /* RECEIVER GETS OFFER */
        socket.on("webrtc:offer", async ({ from, offer }) => {
            const peer = createPeer({
                socket,
                from: authState.data._id,
                to: from,
                onRemoteStream: setRemoteStream,
            });

            peerRef.current = peer;

            const stream = await getMediaStream(call.type);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            stream.getTracks().forEach(track =>
                peer.addTrack(track, stream)
            );

            await peer.setRemoteDescription(offer);

            pendingIceCandidates.current.forEach((c) => {
                peerRef.current.addIceCandidate(new RTCIceCandidate(c));
            });
            pendingIceCandidates.current = [];


            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            socket.emit("webrtc:answer", {
                to: from,
                from: authState.data._id,
                answer,
            });
        });

        /* CALLER GETS ANSWER */
        socket.on("webrtc:answer", async ({ answer }) => {
            await peerRef.current.setRemoteDescription(answer);

            pendingIceCandidates.current.forEach((c) => {
                peerRef.current.addIceCandidate(new RTCIceCandidate(c));
            });
            pendingIceCandidates.current = [];

        });

        /* ICE CANDIDATES */
        socket.on("webrtc:ice-candidate", ({ candidate }) => {
            const peer = peerRef.current;
            if (!peer) return;

            if (peer.remoteDescription) {
                peer.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
                pendingIceCandidates.current.push(candidate);
            }
        });


        socket.on("call:end", ({ by }) => {
            console.log("Call ended by", by);

            // Stop media
            if (localVideoRef.current?.srcObject) {
                localVideoRef.current.srcObject
                    .getTracks()
                    .forEach((t) => t.stop());
            }

            peerRef.current?.close();
            peerRef.current = null;

            setCall({
                inCall: false,
                incoming: false,
                outgoing: false,
                from: null,
                type: null,
            });
        });


        return () => socket.removeAllListeners();
    }, [socket, call.type]);

    useEffect(() => {
        if (!call.inCall || !call.from || !socket || !call.outgoing) return;

        const setupCaller = async () => {
            const peer = createPeer({
                socket,
                from: authState.data._id,
                to: call.from._id,
                onRemoteStream: setRemoteStream,
            });

            peerRef.current = peer;

            const stream = await getMediaStream(call.type);
            if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            }

            stream.getTracks().forEach(track =>
            peer.addTrack(track, stream)
            );

            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            socket.emit("webrtc:offer", {
                to: call.from._id,
                from: authState.data._id,
                offer,
            });
        };

        setupCaller();
    }, [call.inCall, call.outgoing]);

    useEffect (() => {
        // ALWAYS assign to remoteVideoRef, regardless of call type.
        // The <video> element handles audio-only streams perfectly.
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, call.type]);

    /* ================= PREVENT ACCIDENTAL RELOAD ================= */
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (call.inCall || call.incoming || call.outgoing) {
                // Standard way to trigger browser confirmation dialog
                e.preventDefault();
                e.returnValue = ""; // Chrome requires this to be set
                return ""; 
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [call.inCall, call.incoming, call.outgoing]);


    /* ---------- END CALL ---------- */
    const endCall = () => {
        const otherUserId =
            call.from?._id || call.from || call.to || call.to?._id; // supports both formats

        // 1️⃣ Notify other peer
        socket.emit("call:end", {
            callerId: authState.data._id,
            receiverId: otherUserId,
        });

        // 2️⃣ Stop media tracks
        if (localVideoRef.current?.srcObject) {
            localVideoRef.current.srcObject
                .getTracks()
                .forEach((t) => t.stop());
        }

        // 3️⃣ Close peer
        peerRef.current?.close();
        peerRef.current = null;
        setRemoteStream(null);


        // 4️⃣ Reset state
        setCall({
            inCall: false,
            incoming: false,
            outgoing: false,
            from: null,
            type: null,
        });
    };


    return {
        call,
        startCall,
        acceptCall,
        endCall,
        localVideoRef,
        remoteVideoRef,
    };
};
