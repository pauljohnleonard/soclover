import { HandModel } from '../models/hand.model';

export async function fetchLeavesSummary(req, res) {
  try {
    const hands = await HandModel.find()
      .select('playerName createdAt solvers')
      .sort({ createdAt: -1 })
      .lean();

    res.json(hands);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
}
