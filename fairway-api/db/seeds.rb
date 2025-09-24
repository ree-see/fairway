# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

puts "🌱 Seeding golf courses..."

# Create Pebble Beach Golf Links
pebble = Course.find_or_create_by!(name: "Pebble Beach Golf Links") do |course|
  course.city = "Pebble Beach"
  course.state = "CA"
  course.par = 72
  course.course_rating = 75.5
  course.slope_rating = 145
  course.latitude = 36.5674
  course.longitude = -121.9508
  course.description = "One of the most beautiful and challenging courses in the world"
  course.phone = "(831) 622-8723"
  course.website = "https://www.pebblebeach.com"
end

# Create holes for Pebble Beach
pebble_holes = [
  { number: 1, par: 4, distance: 381, handicap: 15 },
  { number: 2, par: 5, distance: 502, handicap: 13 },
  { number: 3, par: 4, distance: 390, handicap: 9 },
  { number: 4, par: 4, distance: 331, handicap: 11 },
  { number: 5, par: 3, distance: 188, handicap: 17 },
  { number: 6, par: 5, distance: 523, handicap: 3 },
  { number: 7, par: 3, distance: 106, handicap: 7 },
  { number: 8, par: 4, distance: 418, handicap: 1 },
  { number: 9, par: 4, distance: 466, handicap: 5 },
  { number: 10, par: 4, distance: 446, handicap: 12 },
  { number: 11, par: 4, distance: 384, handicap: 14 },
  { number: 12, par: 3, distance: 202, handicap: 18 },
  { number: 13, par: 4, distance: 399, handicap: 8 },
  { number: 14, par: 5, distance: 580, handicap: 4 },
  { number: 15, par: 4, distance: 397, handicap: 10 },
  { number: 16, par: 4, distance: 403, handicap: 16 },
  { number: 17, par: 3, distance: 178, handicap: 6 },
  { number: 18, par: 5, distance: 548, handicap: 2 },
]

pebble_holes.each do |hole_data|
  pebble.holes.find_or_create_by!(number: hole_data[:number]) do |hole|
    hole.par = hole_data[:par]
    hole.distance = hole_data[:distance]
    hole.yardage_white = hole_data[:distance]  # Also set white tee for tee selection
    hole.handicap = hole_data[:handicap]
  end
end

# Create Torrey Pines South
torrey = Course.find_or_create_by!(name: "Torrey Pines South") do |course|
  course.city = "La Jolla"
  course.state = "CA"
  course.par = 72
  course.course_rating = 75.0
  course.slope_rating = 129
  course.latitude = 32.8928
  course.longitude = -117.2524
  course.description = "Home of the U.S. Open, spectacular ocean views"
  course.phone = "(858) 581-7171"
  course.website = "https://www.sandiego.gov/golf/torrey-pines"
end

# Create holes for Torrey Pines South
torrey_holes = [
  { number: 1, par: 4, distance: 454, handicap: 7 },
  { number: 2, par: 4, distance: 389, handicap: 13 },
  { number: 3, par: 3, distance: 178, handicap: 17 },
  { number: 4, par: 4, distance: 408, handicap: 3 },
  { number: 5, par: 4, distance: 425, handicap: 11 },
  { number: 6, par: 3, distance: 198, handicap: 15 },
  { number: 7, par: 5, distance: 543, handicap: 1 },
  { number: 8, par: 4, distance: 392, handicap: 9 },
  { number: 9, par: 4, distance: 421, handicap: 5 },
  { number: 10, par: 4, distance: 378, handicap: 16 },
  { number: 11, par: 3, distance: 156, handicap: 18 },
  { number: 12, par: 5, distance: 567, handicap: 6 },
  { number: 13, par: 4, distance: 445, handicap: 2 },
  { number: 14, par: 4, distance: 412, handicap: 12 },
  { number: 15, par: 3, distance: 205, handicap: 14 },
  { number: 16, par: 5, distance: 589, handicap: 4 },
  { number: 17, par: 4, distance: 398, handicap: 10 },
  { number: 18, par: 4, distance: 443, handicap: 8 },
]

torrey_holes.each do |hole_data|
  torrey.holes.find_or_create_by!(number: hole_data[:number]) do |hole|
    hole.par = hole_data[:par]
    hole.distance = hole_data[:distance]
    hole.yardage_white = hole_data[:distance]  # Also set white tee for tee selection
    hole.handicap = hole_data[:handicap]
  end
end

# Create Augusta National (for testing)
augusta = Course.find_or_create_by!(name: "Augusta National Golf Club") do |course|
  course.city = "Augusta"
  course.state = "GA"
  course.par = 72
  course.course_rating = 74.7
  course.slope_rating = 137
  course.latitude = 33.5030
  course.longitude = -82.0197
  course.description = "Home of The Masters Tournament"
  course.phone = "(706) 667-6000"
  course.website = "https://www.masters.com"
end

# Create some holes for Augusta
augusta_holes = [
  { number: 1, par: 4, distance: 445, handicap: 11 },
  { number: 2, par: 5, distance: 575, handicap: 5 },
  { number: 3, par: 4, distance: 350, handicap: 15 },
  { number: 4, par: 3, distance: 240, handicap: 17 },
  { number: 5, par: 4, distance: 495, handicap: 1 },
  { number: 6, par: 3, distance: 180, handicap: 13 },
  { number: 7, par: 4, distance: 450, handicap: 7 },
  { number: 8, par: 5, distance: 570, handicap: 9 },
  { number: 9, par: 4, distance: 460, handicap: 3 },
  { number: 10, par: 4, distance: 495, handicap: 4 },
  { number: 11, par: 4, distance: 520, handicap: 8 },
  { number: 12, par: 3, distance: 155, handicap: 18 },
  { number: 13, par: 5, distance: 510, handicap: 6 },
  { number: 14, par: 4, distance: 440, handicap: 14 },
  { number: 15, par: 5, distance: 550, handicap: 2 },
  { number: 16, par: 3, distance: 170, handicap: 16 },
  { number: 17, par: 4, distance: 440, handicap: 12 },
  { number: 18, par: 4, distance: 465, handicap: 10 },
]

augusta_holes.each do |hole_data|
  augusta.holes.find_or_create_by!(number: hole_data[:number]) do |hole|
    hole.par = hole_data[:par]
    hole.distance = hole_data[:distance]
    hole.yardage_white = hole_data[:distance]  # Also set white tee for tee selection
    hole.handicap = hole_data[:handicap]
  end
end

puts "✅ Created #{Course.count} courses with #{Hole.count} holes"

puts "👥 Creating test users..."

# Create test users
users_data = [
  {
    email: "test@example.com",
    password: "password123",
    first_name: "Test",
    last_name: "User",
    phone: "555-0001",
    handicap_index: 15.4,
    verified_handicap: 14.8
  },
  {
    email: "john@golfer.com", 
    password: "password123",
    first_name: "John",
    last_name: "Golfer",
    phone: "555-0002",
    handicap_index: 8.2,
    verified_handicap: 7.9
  },
  {
    email: "sarah@player.com",
    password: "password123", 
    first_name: "Sarah",
    last_name: "Player",
    phone: "555-0003",
    handicap_index: 22.1,
    verified_handicap: 21.5
  }
]

test_users = users_data.map do |user_data|
  User.find_or_create_by!(email: user_data[:email]) do |user|
    user.password = user_data[:password]
    user.password_confirmation = user_data[:password]
    user.first_name = user_data[:first_name]
    user.last_name = user_data[:last_name]
    user.phone = user_data[:phone]
    user.handicap_index = user_data[:handicap_index]
    user.verified_handicap = user_data[:verified_handicap]
    user.email_verified = true
    user.email_verified_at = Time.current
  end
end

puts "✅ Created #{test_users.count} test users"

puts "⛳ Creating rounds with hole scores..."

courses = [pebble, torrey, augusta]

# Create 3 rounds for each user
test_users.each_with_index do |user, user_index|
  3.times do |round_index|
    course = courses[round_index % courses.count]
    
    # Create round with realistic dates (last 30 days)
    started_at = rand(30.days).seconds.ago
    completed_at = started_at + rand(3..5).hours
    
    round = user.rounds.find_or_create_by!(
      course: course,
      started_at: started_at
    ) do |r|
      r.completed_at = completed_at
      r.submitted_at = completed_at
      r.tee_color = ['white', 'blue'].sample
      r.course_rating = course.course_rating
      r.slope_rating = course.slope_rating
      r.is_provisional = [true, false].sample
      r.is_verified = r.is_provisional ? false : [true, false].sample
      r.verification_count = r.is_verified ? rand(1..3) : 0
      r.location_verified = true
      r.fraud_risk_score = rand(0.0..25.0).round(1)
    end

    # Create hole scores for each hole
    course.holes.order(:number).each do |hole|
      next if round.hole_scores.exists?(hole: hole) # Skip if already exists
      
      # Generate realistic scores based on user handicap and hole difficulty
      user_skill = case user.handicap_index
                  when 0..10 then :scratch
                  when 11..20 then :average  
                  else :high_handicap
                  end
      
      # Base score on par + handicap adjustment
      base_score = case user_skill
                  when :scratch
                    rand(0..2) == 0 ? hole.par - 1 : hole.par + rand(0..1)
                  when :average
                    hole.par + rand(0..2)
                  when :high_handicap
                    hole.par + rand(1..3)
                  end
      
      strokes = [base_score, 1].max # Minimum 1 stroke
      strokes = [strokes, 8].min    # Maximum 8 strokes
      
      # Calculate realistic stats
      putts = case hole.par
              when 3 then rand(1..3)
              when 4 then rand(1..3) 
              when 5 then rand(2..4)
              end
      
      # Fairway hit (only for par 4 and 5)
      fairway_hit = if hole.par >= 4
                     case user_skill
                     when :scratch then rand(0..10) < 7  # 70% fairway hit rate
                     when :average then rand(0..10) < 5   # 50% fairway hit rate  
                     when :high_handicap then rand(0..10) < 3 # 30% fairway hit rate
                     end
                   else
                     false
                   end
      
      # Green in regulation
      regulation_strokes = hole.par - 2
      green_in_regulation = (strokes - putts) <= regulation_strokes
      
      # Up and down (if missed green)
      up_and_down = if !green_in_regulation
                     case user_skill
                     when :scratch then rand(0..10) < 6    # 60% up and down
                     when :average then rand(0..10) < 4    # 40% up and down
                     when :high_handicap then rand(0..10) < 2 # 20% up and down  
                     end
                   else
                     false
                   end

      round.hole_scores.create!(
        hole: hole,
        hole_number: hole.number,
        strokes: strokes,
        putts: putts,
        fairway_hit: fairway_hit,
        green_in_regulation: green_in_regulation,
        up_and_down: up_and_down,
        penalties: rand(0..1), # Occasional penalty
        drive_distance: hole.par >= 4 ? rand(200..280) : nil,
        approach_distance: hole.par >= 4 ? rand(50..150) : nil,
        started_at: started_at + (hole.number * 10).minutes,
        completed_at: started_at + (hole.number * 10 + rand(5..15)).minutes
      )
    end
    
    # Update round totals (this will trigger the callbacks)
    round.save!
    
    puts "  📊 Round #{round_index + 1} for #{user.first_name}: #{round.total_strokes} at #{course.name}"
  end
end

puts "✅ Created rounds and hole scores for all users"
puts "📈 Database stats:"
puts "   Users: #{User.count}"
puts "   Courses: #{Course.count}" 
puts "   Holes: #{Hole.count}"
puts "   Rounds: #{Round.count}"
puts "   Hole Scores: #{HoleScore.count}"
puts "🏌️‍♂️ The Verified Handicap is ready for testing!"
