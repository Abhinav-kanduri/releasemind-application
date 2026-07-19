import { NextRequest, NextResponse } from "next/server";
import { db, context } from "@/lib/db";

export async function GET(req:NextRequest){
  await context();
  const projectId=req.nextUrl.searchParams.get("projectId");
  const spaces=await db.productSpace.findMany({include:{projects:{orderBy:{name:"asc"}}},orderBy:{name:"asc"}});
  const allProjects=spaces.flatMap(s=>s.projects);
  const project=allProjects.find(p=>p.id===projectId)??allProjects[0];
  if(!project)return NextResponse.json({spaces:[],project:null,releases:[],features:[],stories:[],sprints:[]});
  const [releases,features,stories]=await Promise.all([
    db.release.findMany({where:{projectId:project.id,archivedAt:null},orderBy:{createdAt:"desc"}}),
    db.feature.findMany({where:{projectId:project.id,archivedAt:null},orderBy:{title:"asc"}}),
    db.userStory.findMany({where:{projectId:project.id,archivedAt:null},orderBy:{title:"asc"}})
  ]);
  const sprints=[...new Set(stories.map(s=>s.sprintId).filter((x):x is string=>Boolean(x)))].map(id=>({id,name:id}));
  return NextResponse.json({spaces:spaces.map(s=>({id:s.id,name:s.name,projects:s.projects.map(p=>({id:p.id,name:p.name,key:p.key}))})),project:{id:project.id,name:project.name,productSpaceId:project.productSpaceId},releases:releases.map(x=>({id:x.id,name:x.name})),features:features.map(x=>({id:x.id,name:`${x.key} · ${x.title}`,releaseId:x.releaseId})),stories:stories.map(x=>({id:x.id,name:`${x.key} · ${x.title}`,featureId:x.featureId,releaseId:x.releaseId,sprintId:x.sprintId})),sprints});
}
