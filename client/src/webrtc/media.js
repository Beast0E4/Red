export const getMediaStream = async (type) => {
    return navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
    });
};
