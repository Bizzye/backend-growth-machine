import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token: string;

    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = verify(token, process.env.JWT_SECRET) as { id: string };

            if(decoded.id === req.params.id) {
                next();
            } else {
                return res.status(401).json({ message: 'Not authorized' });
            }
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }
    }
}

export default protect;