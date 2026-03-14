'use client'
import { useState } from "react"
import { uploadProjectFile } from "../modules/upload.service"
import RichTextEditor from "@/src/components/ui/RichTextEditor"
export default function TestPage() {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [post, setPost] = useState("");

    const onChange = (content: string) => {
        setPost(content);
        console.log(content);
    };

    const handleSubmit = async () => {
        if (selectedFiles.length === 0) {
            alert("Vui lòng chọn file!")
            return
        }

        setIsUploading(true)
        try {
            const results = await Promise.all(
                selectedFiles.map((file) => uploadProjectFile(file, 'e7debd0b-15c2-41d8-a6ba-4f43ac3dfcd8'))
            )
            console.log("results", results)
            alert("Tải lên thành công!")
        } catch (error) {
            console.error("Lỗi tải lên:", error)
            alert("Có lỗi xảy ra khi tải lên")
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="p-4 flex flex-col gap-4">
            <h1 className="text-xl font-bold">Test Page</h1>
            <input
                type="file"
                multiple
                onChange={(e) => {
                    const files = e.target.files
                    if (!files) return
                    const fileArray = Array.from(files)
                    setSelectedFiles(fileArray)
                }}
            />
            {selectedFiles.length > 0 && (
                <div>
                    <p>Đã chọn {selectedFiles.length} files</p>
                </div>
            )}
            <button
                onClick={handleSubmit}
                disabled={isUploading}
                className="bg-blue-500 text-white px-4 py-2 rounded max-w-[fit-content] disabled:opacity-50"
            >
                {isUploading ? "Đang tải lên..." : "Submit"}
            </button>
            <RichTextEditor />
        </div>
    )
}