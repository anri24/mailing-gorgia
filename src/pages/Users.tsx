import { useState, useMemo } from "react";
import { useUsers } from "@/queries/api/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UsersAPI,
  UpdateUserSchema,
  CreateUserSchema,
  type UpdateUserType,
  type CreateUserType,
} from "@/queries/api/query-slice";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useUserStore } from "@/store/user";
import {
  AlertCircle,
  Loader2,
  User,
  Mail,
  Shield,
  ShieldOff,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type DialogType = "edit" | "create" | null;

export const Users = () => {
  const [page, setPage] = useState(1);
  const [amount] = useState(10);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [selectedUser, setSelectedUser] = useState<UpdateUserType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  const { user: currentUser } = useUserStore();
  const queryClient = useQueryClient();
  const { data: users, isLoading, error } = useUsers(page, amount);

  const filteredUsers = useMemo(() => {
    return users?.filter((user) => !user.isDeleted);
  }, [users]);

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setEditValue,
    formState: { errors: editErrors },
  } = useForm<UpdateUserType>({
    resolver: zodResolver(UpdateUserSchema),
  });

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<CreateUserType>({
    resolver: zodResolver(CreateUserSchema),
  });

  const updateMutation = useMutation({
    mutationFn: UsersAPI.updateUser,
    onSuccess: () => {
      toast.success("მომხმარებელი განახლდა");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("განახლება ვერ მოხერხდა");
      console.error("Failed to update user:", error);
    },
  });

  const createMutation = useMutation({
    mutationFn: UsersAPI.createUser,
    onSuccess: () => {
      toast.success("მომხმარებელი დაემატა");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("დამატება ვერ მოხერხდა");
      console.error("Failed to create user:", error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: UsersAPI.deleteUser,
    onSuccess: () => {
      toast.success("მომხმარებელი წაიშალა");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error("წაშლა ვერ მოხერხდა");
      console.error("Failed to delete user:", error);
    },
  });

  const handleEdit = (user: UpdateUserType) => {
    setSelectedUser(user);
    setEditValue("id", user.id);
    setEditValue("email", user.email);
    setEditValue("firstName", user.firstName);
    setEditValue("lastName", user.lastName);
    setEditValue("isAdmin", user.isAdmin);
    setDialogType("edit");
  };

  const handleDelete = (id: number) => {
    setUserToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogType(null);
    setSelectedUser(null);
    resetEdit();
    resetCreate();
  };

  const onSubmitEdit = async (data: UpdateUserType) => {
    try {
      await updateMutation.mutateAsync(data);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const onSubmitCreate = async (data: CreateUserType) => {
    try {
      await createMutation.mutateAsync(data);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleNextPage = () => {
    if (filteredUsers && filteredUsers.length >= amount) {
      setPage((p) => p + 1);
    }
  };

  const handlePreviousPage = () => {
    setPage((p) => Math.max(1, p - 1));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-destructive">
        <AlertCircle className="w-6 h-6 mr-2" />
        <span>მომხმარებლების ჩატვირთვა ვერ მოხერხდა: {error.message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">მომხმარებლები</h1>
        <div className="flex items-center gap-4">
          {currentUser?.isAdmin && (
            <Button onClick={() => setDialogType("create")} className="gap-2">
              <UserPlus className="w-4 h-4" />
              დამატება
            </Button>
          )}
          <Badge variant="outline" className="text-sm">
            სულ: {filteredUsers?.length || 0}
          </Badge>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>სახელი</TableHead>
              <TableHead>ელ. ფოსტა</TableHead>
              <TableHead>როლი</TableHead>
              <TableHead className="text-right">მოქმედება</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    {user.firstName} {user.lastName}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    {user.email}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {user.isAdmin ? (
                      <>
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="text-primary">ადმინისტრატორი</span>
                      </>
                    ) : (
                      <>
                        <ShieldOff className="w-4 h-4 text-muted-foreground" />
                        <span>მომხმარებელი</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(user)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      რედაქტირება
                    </Button>
                    {currentUser?.isAdmin &&
                      user.id.toString() !== currentUser?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          წაშლა
                        </Button>
                      )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePreviousPage}
          disabled={page === 1}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          წინა
        </Button>
        <Badge variant="secondary">გვერდი {page}</Badge>
        <Button
          variant="outline"
          onClick={handleNextPage}
          disabled={!filteredUsers || filteredUsers.length < amount}
          className="gap-2"
        >
          შემდეგი
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <Dialog
        open={dialogType === "edit"}
        onOpenChange={() => handleCloseDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>მომხმარებლის რედაქტირება</DialogTitle>
            <DialogDescription>
              შეცვალეთ მომხმარებლის ინფორმაცია და დააჭირეთ შენახვას
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4">
            <input type="hidden" {...registerEdit("id")} />

            <div className="space-y-2">
              <Label htmlFor="email">ელ. ფოსტა</Label>
              <Input
                id="email"
                {...registerEdit("email")}
                className={cn(editErrors.email && "border-destructive")}
              />
              {editErrors.email && (
                <p className="text-sm text-destructive">
                  {editErrors.email.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">სახელი</Label>
                <Input
                  id="firstName"
                  {...registerEdit("firstName")}
                  className={cn(editErrors.firstName && "border-destructive")}
                />
                {editErrors.firstName && (
                  <p className="text-sm text-destructive">
                    {editErrors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">გვარი</Label>
                <Input
                  id="lastName"
                  {...registerEdit("lastName")}
                  className={cn(editErrors.lastName && "border-destructive")}
                />
                {editErrors.lastName && (
                  <p className="text-sm text-destructive">
                    {editErrors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {currentUser?.isAdmin &&
              selectedUser?.id.toString() !== currentUser?.id && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isAdmin"
                    {...registerEdit("isAdmin")}
                    defaultChecked={selectedUser?.isAdmin}
                    onCheckedChange={(checked) => {
                      setEditValue("isAdmin", checked === true);
                    }}
                  />
                  <Label htmlFor="isAdmin">ადმინისტრატორი</Label>
                </div>
              )}

            <div className="flex justify-end gap-2">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="gap-2"
              >
                {updateMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {updateMutation.isPending ? "მიმდინარეობს..." : "შენახვა"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                გაუქმება
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogType === "create"}
        onOpenChange={() => handleCloseDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>მომხმარებლის დამატება</DialogTitle>
            <DialogDescription>
              შეავსეთ მომხმარებლის ინფორმაცია და დააჭირეთ დამატებას
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmitCreate(onSubmitCreate)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">ელ. ფოსტა</Label>
              <Input
                id="email"
                {...registerCreate("email")}
                className={cn(createErrors.email && "border-destructive")}
              />
              {createErrors.email && (
                <p className="text-sm text-destructive">
                  {createErrors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">პაროლი</Label>
              <Input
                id="password"
                type="password"
                {...registerCreate("password")}
                className={cn(createErrors.password && "border-destructive")}
              />
              {createErrors.password && (
                <p className="text-sm text-destructive">
                  {createErrors.password.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">სახელი</Label>
                <Input
                  id="firstName"
                  {...registerCreate("firstName")}
                  className={cn(createErrors.firstName && "border-destructive")}
                />
                {createErrors.firstName && (
                  <p className="text-sm text-destructive">
                    {createErrors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">გვარი</Label>
                <Input
                  id="lastName"
                  {...registerCreate("lastName")}
                  className={cn(createErrors.lastName && "border-destructive")}
                />
                {createErrors.lastName && (
                  <p className="text-sm text-destructive">
                    {createErrors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="gap-2"
              >
                {createMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {createMutation.isPending ? "მიმდინარეობს..." : "დამატება"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                გაუქმება
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>მომხმარებლის წაშლა</AlertDialogTitle>
            <AlertDialogDescription>
              დარწმუნებული ხართ რომ გსურთ მომხმარებლის წაშლა? ეს მოქმედება
              შეუქცევადია.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              გაუქმება
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (userToDelete) {
                  deleteMutation.mutate(userToDelete);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              წაშლა
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;
