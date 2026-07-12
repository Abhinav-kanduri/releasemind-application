import { NextRequest, NextResponse } from "next/server";
import { db, context, assertRelease, jsonList } from "@/lib/db";
import { z } from "zod";

const releaseInput=z.object({action:z.enum(["create","rename","archive","restore","delete","unassignDelete"]),id:z.string().optional(),name:z.string().trim().min(1).optional(),version:z.string().optional(),description:z.string().optional(),status:z.string().optional()});
export async function GET(){
  const project=await context();
  const [releases,features,stories]=await Promise.all([
    db.release.findMany({where:{projectId:project.id},include:{_count:{select:{features:true,stories:true}}},orderBy:{createdAt:"desc"}}),
    db.feature.findMany({where:{projectId:project.id},include:{release:true,criteria:true,_count:{select:{stories:true}}},orderBy:{updatedAt:"desc"}}),
    db.userStory.findMany({where:{projectId:project.id},include:{release:true,feature:true,criteria:true},orderBy:{updatedAt:"desc"}})
  ]);
  return NextResponse.json({project:{id:project.id,key:project.key,name:project.name,productSpaceId:project.productSpaceId},releases,features:features.map(f=>({...f,functionalRequirements:jsonList(f.functionalRequirements),nonFunctionalRequirements:jsonList(f.nonFunctionalRequirements),dependencies:jsonList(f.dependencies),risks:jsonList(f.risks),assumptions:jsonList(f.assumptions)})),stories});
}
export async function POST(req:NextRequest){
  try{
    const body=releaseInput.parse(await req.json()); const project=await context();
    if(body.action==="create") return NextResponse.json(await db.release.create({data:{projectId:project.id,productSpaceId:project.productSpaceId,name:body.name!,version:body.version||null,description:body.description||null,status:body.status||"DRAFT"}}));
    const release=await db.release.findFirst({where:{id:body.id,projectId:project.id}}); if(!release) return NextResponse.json({error:"Release not found"},{status:404});
    if(body.action==="rename") return NextResponse.json(await db.release.update({where:{id:release.id},data:{name:body.name!}}));
    if(body.action==="archive") return NextResponse.json(await db.release.update({where:{id:release.id},data:{status:"ARCHIVED",archivedAt:new Date()}}));
    if(body.action==="restore") return NextResponse.json(await db.release.update({where:{id:release.id},data:{status:"DRAFT",archivedAt:null}}));
    if(body.action==="unassignDelete") { await db.$transaction([db.feature.updateMany({where:{releaseId:release.id},data:{releaseId:null}}),db.userStory.updateMany({where:{releaseId:release.id},data:{releaseId:null}}),db.release.delete({where:{id:release.id}})]); return NextResponse.json({success:true}); }
    const counts=await db.release.findUnique({where:{id:release.id},select:{_count:{select:{features:true,stories:true}}}}); if((counts?._count.features||0)+(counts?._count.stories||0)>0)return NextResponse.json({error:`This Release contains ${counts?._count.features} Features and ${counts?._count.stories} User Stories.`},{status:409});
    await db.release.delete({where:{id:release.id}}); return NextResponse.json({success:true});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Invalid request"},{status:400})}
}
