export default function CallModal({ localStream, remoteStream, onEnd }) {
  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      <video
        autoPlay
        muted
        ref={(v) => v && localStream && (v.srcObject = localStream)}
        className="w-40 h-40 absolute bottom-4 right-4 rounded"
      />

      <video
        autoPlay
        ref={(v) => v && remoteStream && (v.srcObject = remoteStream)}
        className="flex-1"
      />

      <button
        onClick={onEnd}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-600 px-6 py-3 rounded-full"
      >
        End Call
      </button>
    </div>
  );
}
