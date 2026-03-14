// type instructionalVideo = {
//     iframe : string;
//     title : string;
// }
export default function InstructionalVideos() {
    return (
        <div>
            <div className="mt-2 px-2 bg-white border rounded-md">
                <div>
                    <iframe width="560" height="315" src="https://www.youtube.com/embed/rNmgJj-tqO0?si=dA04-m-fK1_R2Kvv" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen
                        className="block h-50 w-full rounded-md"
                    ></iframe>
                    <h3 className="text-center text-gray-700 font-medium">Lorem ipsum dolor sit amet</h3>
                </div>
                <div>
                    <iframe width="560" height="315" src="https://www.youtube.com/embed/rNmgJj-tqO0?si=dA04-m-fK1_R2Kvv" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen
                        className="block h-50 w-full rounded-md"
                    ></iframe>
                    <h3 className="text-center text-gray-700 font-medium">Lorem ipsum dolor sit amet</h3>
                </div>
                <div>
                    <iframe width="560" height="315" src="https://www.youtube.com/embed/rNmgJj-tqO0?si=dA04-m-fK1_R2Kvv" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen
                        className="block h-50 w-full rounded-md"
                    ></iframe>
                    <h3 className="text-center text-gray-700 font-medium">Lorem ipsum dolor sit amet</h3>
                </div>
            </div>
            <div className="mt-3 h-30 bg-white border rounded-md ml-4 mr-4">
                <div className="row-s flex h-full items-center justify-around px-4">
                    <div className="col-s flex flex-col items-center">
                        <div className="mb-2">
                            <img src="/svgs/map-solid.svg" alt="Bản đồ quy hoạch" className="w-8 h-8" />
                        </div>
                        <span className="link-sqh text-sm font-medium text-gray-700 text-center">Bản đồ quy hoạch</span>
                    </div>

                    <div className="col-s flex flex-col items-center">
                        <div className="mb-2">
                            <img src="/svgs/map-solid.svg" alt="Thông tin quy hoạch" className="w-8 h-8" />
                        </div>
                        <span className="link-sqh text-sm font-medium text-gray-700 text-center">Thông tin quy hoạch</span>
                    </div>

                    <div className="col-s flex flex-col items-center">
                        <div className="mb-2">
                            <img src="/svgs/map-solid.svg" alt="Tra cứu quy hoạch" className="w-8 h-8" />
                        </div>
                        <span className="link-sqh text-sm font-medium text-gray-700 text-center">Tra cứu quy hoạch</span>
                    </div>
                </div>
            </div>
            <div className="mt-2 h-22 ml-4 mr-4 rounded-md bg-center bg-cover
            "
                style={{ backgroundImage: 'url("https://media.istockphoto.com/id/2173059563/vi/vec-to/%C4%91%E1%BA%BFn-s%E1%BB%9Bm-h%C3%ACnh-%E1%BA%A3nh-tr%C3%AAn-n%E1%BB%81n-tr%E1%BA%AFng-kh%C3%B4ng-c%C3%B3-s%E1%BA%B5n-%E1%BA%A3nh.jpg?s=1024x1024&w=is&k=20&c=NItqj_jaYCsWltHw9WRV6kzmIiyEcsYrJM2LkWxOgtk=")' }}
            >

            </div>
        </div>
    )
}