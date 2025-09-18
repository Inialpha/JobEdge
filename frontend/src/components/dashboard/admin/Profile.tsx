'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, MapPin, Link as LinkIcon, Mail, Twitter, GitBranch, MessageCircle } from 'lucide-react'

interface UserProfileProps {
  name: string
  username: string
  bio: string
  location: string
  website: string
  email: string
  twitter: string
  github: string
  joinDate: string
  avatarUrl: string
  coverImageUrl: string
  followers: number
  following: number
  posts: number
}

export default function Profile({
  name = "Jane Doe",
  username = "janedoe",
  bio = "Software engineer passionate about creating intuitive user experiences and solving complex problems.",
  location = "San Francisco, CA",
  website = "https://janedoe.com",
  email = "jane@example.com",
  twitter = "janedoe",
  github = "janedoe",
  joinDate = "January 2020",
  avatarUrl = "https://example.com/avatar.jpg",
  coverImageUrl = "https://example.com/cover.jpg",
  followers = 1234,
  following = 567,
  posts = 89
}: UserProfileProps) {
  const [isFollowing, setIsFollowing] = useState(false)

  const toggleFollow = () => {
    setIsFollowing(!isFollowing)
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <div className="relative h-48 md:h-64">
        <img
          src={coverImageUrl}
          alt="Profile cover"
          className="rounded-t-lg"
        />
      </div>
      <CardHeader className="relative pb-0">
        <div className="absolute -top-16 left-4 border-4 border-background rounded-full">
          <Avatar className="w-32 h-32">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex justify-end mb-4">
          <Button onClick={toggleFollow} variant={isFollowing ? "secondary" : "default"}>
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        </div>
        <CardTitle className="text-2xl font-bold">{name}</CardTitle>
        <div className="flex items-center text-muted-foreground">
          <span>@{username}</span>
          <Badge variant="secondary" className="ml-2">Pro</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mt-2 text-muted-foreground">{bio}</p>
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center text-muted-foreground">
            <MapPin className="w-4 h-4 mr-1" />
            {location}
          </div>
          <div className="flex items-center text-muted-foreground">
            <LinkIcon className="w-4 h-4 mr-1" />
            <a href={website} target="_blank" rel="noopener noreferrer" className="hover:underline">{website}</a>
          </div>
          <div className="flex items-center text-muted-foreground">
            <CalendarDays className="w-4 h-4 mr-1" />
            Joined {joinDate}
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          <Button variant="outline" size="sm" className="flex items-center" asChild>
            <a href={`mailto:${email}`}>
              <Mail className="w-4 h-4 mr-1" />
              Email
            </a>
          </Button>
          <Button variant="outline" size="sm" className="flex items-center" asChild>
            <a href={`https://twitter.com/${twitter}`} target="_blank" rel="noopener noreferrer">
              <Twitter className="w-4 h-4 mr-1" />
              Twitter
            </a>
          </Button>
          <Button variant="outline" size="sm" className="flex items-center" asChild>
            <a href={`https://github.com/${github}`} target="_blank" rel="noopener noreferrer">
              <GitBranch className="w-4 h-4 mr-1" />
              GitHub
            </a>
          </Button>
        </div>
        <div className="flex justify-between mt-6 text-center">
          <div>
            <div className="text-2xl font-bold">{followers.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Followers</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{following.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Following</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{posts.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Posts</div>
          </div>
        </div>
        <Tabs defaultValue="posts" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="posts" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((post) => (
                    <div key={post} className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarImage src={avatarUrl} alt={name} />
                        <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Post title {post}</p>
                        <p className="text-sm text-muted-foreground">
                          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                        </p>
                        <div className="flex items-center pt-2">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          <span className="text-xs text-muted-foreground">{Math.floor(Math.random() * 50) + 1} comments</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="projects" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Project A', 'Project B', 'Project C'].map((project) => (
                    <div key={project} className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{project}</h3>
                        <p className="text-sm text-muted-foreground">Brief description of {project}</p>
                      </div>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="activity" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Commented on a post', 'Started a new project', 'Updated profile picture'].map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <p className="text-sm">{activity}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
