import { Prop, Schema, SchemaFactory, } from "@nestjs/mongoose";
import { HydratedDocument,Types } from "mongoose";
export type RoomChatMessageDocument = HydratedDocument<RoomChatMessage>;

@Schema()
export class RoomChatMessage {

    @Prop()
    usernames: string[]

    @Prop()
    messages: [
        {   
            _id: Types.ObjectId;
            username: string,
            message: string[],
            timestamp: Date
        }
    ]

}
export const RoomChatMessageSchema = SchemaFactory.createForClass(RoomChatMessage)