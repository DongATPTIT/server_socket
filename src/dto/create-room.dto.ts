export class CreateRoomMessageDto {
    usernames?: [{
        id: string,
        username: string
    }];

    messages?: [{
        username: string,
        message: string[],
        timestamp: Date
    }];

}