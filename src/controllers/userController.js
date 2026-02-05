import { prisma } from "../config/db.js";

const viewUser = async (req, res) => {
  const { id } = req.params;
  // Find user by ID
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
  });

  if (user.id !== req.user.id) {
    res.status(403).json({
      error: "Not allowed to view this user",
    });
  }

  res.status(200).json({
    data: {
      user,
    },
  });
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  // Find user by ID
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
  });

  if (user.id !== req.user.id) {
    res.status(403).json({
      error: "Not allowed to update this user",
    });
  }

  await prisma.user.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.status(200).json({
    status: "Success",
    message: "User updated successfully",
  });
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  // Find user by ID
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
  });

  if (!user) {
    res.status(404).json({
      error: "User not found",
    });
  }

  if (user.id !== req.user.id) {
    res.status(403).json({
      error: "Not allowed to delete this user",
    });
  }
  await prisma.user.delete({
    where: { id: req.params.id },
  });

  res.status(200).json({
    status: "Success",
    message: "User removed from shelf",
  });
};
export { deleteUser, updateUser, viewUser };
