'use client'

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Send } from "lucide-react";
import { toast } from "sonner";

const mockPosts = [
  {
    id: 1,
    title: "Welcome to Our Community!",
    content: "We're excited to have you join our membership program...",
    status: "published",
    date: "2024-12-15",
  },
  {
    id: 2,
    title: "Important Payment Reminder",
    content: "Please ensure your monthly payment is up to date...",
    status: "published",
    date: "2024-12-10",
  },
  {
    id: 3,
    title: "Upcoming Payout Announcement",
    content: "Draft content for the next payout cycle...",
    status: "draft",
    date: "2024-12-20",
  },
];

export default function ContentManagement() {
  const [posts, setPosts] = useState(mockPosts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  const handleCreatePost = () => {
    if (!formData.title || !formData.content) {
      toast.error("Please fill in all fields");
      return;
    }

    const newPost = {
      id: posts.length + 1,
      title: formData.title,
      content: formData.content,
      status: "draft",
      date: new Date().toISOString().split("T")[0],
    };

    setPosts([newPost, ...posts]);
    setFormData({ title: "", content: "" });
    setIsDialogOpen(false);
    toast.success("Post created successfully!");
  };

  const handlePublish = (postId: number) => {
    setPosts(
      posts.map((post) =>
        post.id === postId ? { ...post, status: "published" } : post
      )
    );
    toast.success("Post published successfully!");
  };

  const handleDelete = (postId: number) => {
    setPosts(posts.filter((post) => post.id !== postId));
    toast.success("Post deleted successfully!");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Content Management
          </h1>
          <p className="text-muted-foreground">
            Create and manage content for the member news feed.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-gradient-primary">
              <Plus className="h-5 w-5 mr-2" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter post title..."
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Enter post content..."
                  rows={8}
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreatePost}>Create Post</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {posts.length}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {posts.filter((p) => p.status === "published").length}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">
              {posts.filter((p) => p.status === "draft").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      {post.title}
                    </h3>
                    <Badge
                      variant={
                        post.status === "published" ? "default" : "secondary"
                      }
                      className={
                        post.status === "published" ? "bg-success" : ""
                      }
                    >
                      {post.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-3">
                    {post.content.substring(0, 150)}...
                  </p>
                  <p className="text-sm text-muted-foreground">{post.date}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  {post.status === "draft" && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handlePublish(post.id)}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Publish
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(post.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
