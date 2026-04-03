"use client";

import { useParams, useRouter } from "next/navigation";
import { VideoCall } from "@/components/VideoCall";

export default function VideoCallPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    if (!id) return null;

    return (
        <div className="fixed inset-0 bg-black z-[500]">
            <VideoCall
                isCaller={true}
                receiverId={id as any}
                onClose={() => {
                    // Redirect back to main or close window
                    if (window.opener) {
                        window.close();
                    } else {
                        router.push("/");
                    }
                }}
            />
        </div>
    );
}
