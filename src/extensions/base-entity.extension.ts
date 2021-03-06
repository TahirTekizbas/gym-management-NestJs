import { BaseEntity } from 'typeorm/repository/BaseEntity';
import { IDto } from '../helpers/dto.interface';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';

declare module 'typeorm/repository/BaseEntity' {
    export interface BaseEntity {
        updateWithDto(this: BaseEntity, dto: IDto): void;
    }
}
  
BaseEntity.prototype.updateWithDto = function (this: BaseEntity, dto: IDto) {
    const entity = this;

    if (!entity) {
        return;
    }

    for (const [key, value] of Object.entries(dto)) {
        const entityKeys = Object.keys(entity);

        if (entityKeys.includes(key)) {
            entity[key] = value;
        } else {
            throw new InternalServerErrorException(`Property \"${key}\" from update DTO is not found in entity`);
        }
    }
  };
  
  export {}

