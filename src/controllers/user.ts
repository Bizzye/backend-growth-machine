import { Request, Response } from 'express';
import User from '../models/user';

export async function createUser(req: Request, res: Response) {
    const { email, password, firstName, lastName, birthDate } = req.body;
    const userExists = await User.findOne({ email });

    if(userExists) {
        return res.status(400).json({ error: 'User already exists' });
    }

    try {
        const user = await User.create({
            email,
            password,
            firstName,
            lastName,
            birthDate
        });

        return res.status(201).json(user);
    } catch(error) {
        return res.status(400).json({ message: 'Error creating user', error });
    }
}

export async function listUsers(req: Request, res: Response) {
    try {
        let docs = await User.find({});
        let nDocs = docs.map((item) => {
            const data = {
                id: item._id,
                email: item.email,
                firstName: item.firstName,
                createdAt: item.createdAt,
                lastName: item?.lastName,
                birthDate: item?.birthDate
            }

            return data;
        });

        return res.status(200).json(nDocs);
      } catch (error) {
        return res.status(400).json({ message: 'Error listing users', error });
    }
}

export async function updateUser(req: Request, res: Response) {
    const user = await User.findById(req.params.id);

    if(!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    // user.email = req.body.email || user.email;

    try {
        const updateUser = await user.save();
        return res.status(201).json(updateUser);
    } catch(error) {
        return res.status(400).json({ message: 'Error updating user', error });
    }
}