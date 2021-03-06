import { NotFoundException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { GymSession } from './gym-session.entity';
import { GymClass } from 'src/gym-classes/gym-class.entity';
import { GymSessionStatus } from 'src/gym-sessions/gymsession-status.enum';
import { DateHelper } from '../helpers/date.helper';
import { GetSessionsFilterDto } from './dto/get-sessions-filter.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from "./dto/update-session.dto";

@EntityRepository(GymSession)
export class GymSessionRepository extends Repository<GymSession> {

    async getSessions(filterDto: GetSessionsFilterDto): Promise<GymSession[]> {
        const { start, end } = filterDto;

        const query = this.createQueryBuilder('gymSession');

        // eager only works for 'find' method => left join is required
        query.leftJoinAndSelect('gymSession.gymClass', 'gymClass')
        // left join photos for gymClass
        query.leftJoinAndSelect('gymClass.photos', 'photo')

        if (start) {
            query.andWhere('gymSession.startDate >= :start', { start });
            query.andWhere('gymSession.finishDate >= :start', { start });
        }

        if (end) {
            query.andWhere('gymSession.startDate <= :end', { end });
            query.andWhere('gymSession.finishDate <= :end', { end });
        }

        const fetchedSessions = await query.getMany();
        return fetchedSessions;
    }


    async getSessionById(id: string): Promise<GymSession> {
        return this.findOne({
            where: { id },
            join: {
                alias: 'gymSession',
                leftJoinAndSelect: {
                    gymClass: 'gymSession.gymClass',
                    // photos: 'gymSession.gymClass.photo'
                }
            },
        });
    }


    async createSession(createSessionDto: CreateSessionDto, gymClass: GymClass): Promise<GymSession> {
        const { startDate, finishDate } = createSessionDto;

        const dateHelper = new DateHelper();

        const newSession = new GymSession();
        newSession.status = GymSessionStatus.PLACES_AVAILABLE;
        newSession.gymClass = gymClass;
        newSession.startDate = dateHelper.convertToUtc(startDate);
        newSession.finishDate = dateHelper.convertToUtc(finishDate);
        await newSession.save();

        // Set to return the current UTC ISO date
        newSession.startDate = new Date(startDate);
        newSession.finishDate = new Date(finishDate);

        return newSession;
    }


    async updateSession(sessionId: string, updateSessionDto: UpdateSessionDto, gymClass: GymClass): Promise<GymSession> {
        const session = await this.findOne(sessionId);

        if (!session) {
            throw new NotFoundException(`Gym session with id = ${sessionId} not found`);
        }

        const dateHelper = new DateHelper();
        const { startDate, finishDate, status } = updateSessionDto;

        if (gymClass) session.gymClass = gymClass;
        if (status) session.status = status;
        if (startDate) session.startDate = dateHelper.convertToUtc(startDate);
        if (finishDate) session.finishDate = dateHelper.convertToUtc(finishDate);

        await session.save();

        // Set to return the current UTC ISO date
        if (startDate) session.startDate = new Date(startDate);
        if (finishDate) session.finishDate = new Date(finishDate);

        return session;
    }
}