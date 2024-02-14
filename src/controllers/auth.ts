import { Request, Response } from 'express';
import User from '../models/user';
import { generateToken } from '../utils/generateToken';

export async function login(req: Request, res: Response) {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if(!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    if(!user) {
        return res.status(400).json({ error: 'User not found' });
    }

    if(await user.comparePassword(password)) {
        return res.status(200).json({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            id: user._id,
            token: generateToken(user._id.toString())
        });
    }

    return res.status(400).json('Invalid password');
}