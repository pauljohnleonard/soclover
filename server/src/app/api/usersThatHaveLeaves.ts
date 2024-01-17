// express end point for getting list of users that have leaves in hand

import { HandModel } from '../models/hand.model';

export async function usersThatHaveLeaves(req, res) {
  // Logic to retrieve list of users that have leaves in HandModel

  try {
    const usersWithLeaves = await getUsersWithLeaves();

    // Send the response with the list of users
    res.json(usersWithLeaves);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
}

async function getUsersWithLeaves() {
  // Logic to retrieve list of users that have leaves in HandModel
  const usersWithLeaves = await HandModel.distinct('playerName');

  // Return the list of users
  return usersWithLeaves;
}
