export type Post = {
    userId:number,
    content:string,
    tags:string[],
    createdAt:Date,
    likes:number,
    comments:string[]
}